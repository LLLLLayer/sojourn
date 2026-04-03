/**
 * Application Service Layer
 *
 * Single source of truth for business orchestration.
 * CLI and Server both call this layer — no duplicated flow logic.
 */

import type { MessageTree, AnalysisResult, DistillMode } from "@sojourn/shared";
import { loadConfig } from "./config.js";
import { resolveSessionPath, listSessions } from "./sessions.js";
import type { SessionInfo } from "./sessions.js";
import { detectFormat } from "./parser/detect.js";
import { ClaudeCodeParser } from "./parser/claude.js";
import { OpenCodeParser } from "./parser/opencode.js";
import { CursorParser } from "./parser/cursor.js";
import { ClaudeCodeAnalyzer } from "./analyzer/claude-code.js";
import { ClaudeAnalyzer } from "./analyzer/claude-api.js";
import type { BaseParser } from "./parser/base.js";
import type { BaseAnalyzer } from "./analyzer/base.js";
import { classify, classifyMulti } from "./distiller/classifier.js";
import { savePending, getPending, updatePendingStatus } from "./store.js";
import { commitToSink } from "./commit.js";
import { findDuplicates } from "./dedup.js";

// --- Parser factory (config-aware) ---

const PARSERS: Record<string, new () => BaseParser> = {
  "claude-code": ClaudeCodeParser,
  opencode: OpenCodeParser,
  cursor: CursorParser,
};

function getParser(format: string): BaseParser {
  const Ctor = PARSERS[format];
  if (!Ctor) throw new Error(`No parser for format: ${format}. Available: ${Object.keys(PARSERS).join(", ")}`);
  return new Ctor();
}

// --- Analyzer factory (config-aware) ---

async function getAnalyzer(name?: string): Promise<BaseAnalyzer> {
  const config = await loadConfig();
  const analyzerName = name ?? config.defaultAnalyzer ?? "claude-code";

  if (analyzerName === "claude-code") {
    return new ClaudeCodeAnalyzer();
  }
  if (analyzerName === "claude-api") {
    const cfg = config.analyzers?.["claude-api"] ?? {};
    return new ClaudeAnalyzer({
      apiKey: cfg.apiKey,
      model: cfg.model,
    });
  }
  throw new Error(`Unknown analyzer: ${analyzerName}. Available: claude-code, claude-api`);
}

// --- Application Services ---

export interface DistillOptions {
  sessionPaths: string[];
  mode?: DistillMode;
  analyzer?: string;
}

export interface DistillServiceResult {
  id: string;
  result: AnalysisResult;
  duplicates: Array<{ id: string; similarity: number; title: string }>;
}

/**
 * Core distill flow — resolve, parse, classify, analyze, dedup, save.
 * Both CLI and Server call this single function.
 */
export async function distillSessions(
  options: DistillOptions
): Promise<DistillServiceResult> {
  const { sessionPaths, mode: requestedMode, analyzer: analyzerName } = options;

  if (!sessionPaths?.length) {
    throw new Error("sessionPaths is required and must be non-empty");
  }

  // 1. Resolve and parse
  const trees: MessageTree[] = [];
  for (const input of sessionPaths) {
    const path = await resolveSessionPath(input);
    const format = await detectFormat(path);
    const parserName = format === "unknown" ? "claude-code" : format;
    const parser = getParser(parserName);
    trees.push(await parser.parse(path));
  }

  // 2. Classify
  let mode: Exclude<DistillMode, "auto">;
  if (requestedMode && requestedMode !== "auto") {
    mode = requestedMode as Exclude<DistillMode, "auto">;
  } else if (trees.length > 1) {
    mode = classifyMulti(trees);
  } else {
    mode = classify(trees[0]);
  }

  // 3. Analyze
  const analyzer = await getAnalyzer(analyzerName);
  const result =
    trees.length > 1
      ? await analyzer.analyzeMulti(trees, mode)
      : await analyzer.analyze(trees[0], mode);

  // 4. Save to pending
  const sessionIds = trees.map((t) => t.sessionId);
  const id = await savePending(sessionIds, result);

  // 5. Dedup check
  const duplicates = await findDuplicates(result);

  if (duplicates.length > 0) {
    await updatePendingStatus(id, "pending", undefined, {
      ...result,
      _duplicates: duplicates,
    });
  }

  return { id, result, duplicates };
}

/**
 * Commit a pending result to one or more sinks.
 *
 * - If sinkName is provided, writes to that single sink.
 * - If not, writes to ALL configured defaultSinks (fan-out).
 * - Falls back to "claude-md" if no defaults configured.
 */
export async function commitPendingResult(
  id: string,
  sinkName?: string,
  outputPath?: string
): Promise<string[]> {
  const item = await getPending(id);
  if (!item) throw new Error(`Pending result not found: ${id}`);

  const config = await loadConfig();

  // Determine which sinks to write to
  const sinks: string[] = sinkName
    ? [sinkName]
    : (config.defaultSinks?.length ? config.defaultSinks : ["claude-md"]);

  // Fan-out to all target sinks
  const committed: string[] = [];
  for (const sink of sinks) {
    await commitToSink(item.resultData, { sink, outputPath });
    committed.push(sink);
  }

  await updatePendingStatus(id, "committed", committed.join(", "));
  return committed;
}

/**
 * List sessions (config-aware logPath).
 */
export async function listAvailableSessions(): Promise<SessionInfo[]> {
  return listSessions();
}
