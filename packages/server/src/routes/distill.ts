import { Hono } from "hono";
import { join } from "path";
import { homedir } from "os";
import { realpath } from "fs/promises";
import {
  parserRegistry,
  analyzerRegistry,
  classify,
  classifyMulti,
  detectFormat,
  savePending,
  listPending,
  getPending,
  updatePendingStatus,
  discardPending,
  commitToSink,
  findDuplicates,
} from "@sojourn/core";
import type { DistillMode, MessageTree } from "@sojourn/shared";

const distill = new Hono();

// --- Path safety ---

async function getAllowedReadDirs(): Promise<string[]> {
  const { loadConfig } = await import("@sojourn/core");
  const config = await loadConfig();
  const logPath = config.agents?.["claude-code"]?.logPath
    ?? join(homedir(), ".claude", "projects");
  // Deduplicate: always include default + configured
  const dirs = new Set([
    join(homedir(), ".claude", "projects"),
    logPath,
  ]);
  return [...dirs];
}

const ALLOWED_WRITE_DIRS = [
  process.cwd(),
  join(homedir(), ".sojourn"),
  join(homedir(), ".claude"),
];

async function validateReadPath(p: string): Promise<string> {
  const resolved = await realpath(p).catch(() => p);
  if (resolved.includes("..")) throw new Error("Invalid path: contains ..");
  const allowedDirs = await getAllowedReadDirs();
  const allowed = allowedDirs.some((dir) => resolved.startsWith(dir));
  if (!allowed) throw new Error(`Path not allowed: must be under configured log path`);
  return resolved;
}

async function validateWritePath(p: string): Promise<void> {
  if (p.includes("..")) throw new Error("Invalid path: contains ..");
  const { dirname, basename } = await import("path");
  const abs = p.startsWith("/") ? p : join(process.cwd(), p);
  // Resolve the *parent directory* realpath (handles symlink dirs with new filenames)
  // If parent doesn't exist yet, resolve its parent, and so on up the chain
  const dir = dirname(abs);
  let resolvedDir: string;
  try {
    resolvedDir = await realpath(dir);
  } catch {
    try {
      resolvedDir = await realpath(dirname(dir));
    } catch {
      resolvedDir = dir;
    }
  }
  const resolved = join(resolvedDir, basename(abs));
  const allowed = ALLOWED_WRITE_DIRS.some((d) => resolved.startsWith(d));
  if (!allowed) throw new Error(`Output path not allowed: real path resolves outside allowed directories`);
}

// --- Routes ---

// Trigger distillation
distill.post("/", async (c) => {
  try {
    const body = await c.req.json<{
      sessionPaths: string[];
      mode?: string;
      analyzer?: string;
    }>();

    // Input validation
    if (!body.sessionPaths?.length) {
      return c.json({ error: "sessionPaths is required and must be non-empty" }, 400);
    }

    const validModes = ["thought_tree", "sop", "workflow", "auto"];
    if (body.mode && !validModes.includes(body.mode)) {
      return c.json({ error: `Invalid mode: ${body.mode}` }, 400);
    }

    // Validate paths upfront
    const safePaths: string[] = [];
    for (const path of body.sessionPaths) {
      safePaths.push(await validateReadPath(path));
    }

    // Create a "processing" pending entry immediately
    const placeholderResult = {
      type: (body.mode && body.mode !== "auto" ? body.mode : "sop") as Exclude<DistillMode, "auto">,
      sessionIds: safePaths.map((p) => p.split("/").pop()?.replace(".jsonl", "") ?? ""),
      createdAt: new Date(),
    };
    const id = await savePending(placeholderResult.sessionIds, placeholderResult);
    await updatePendingStatus(id, "processing" as any);

    // Run analysis in background (non-blocking)
    (async () => {
      try {
        const trees: MessageTree[] = [];
        for (const safePath of safePaths) {
          const format = await detectFormat(safePath);
          const parserName = format === "unknown" ? "claude-code" : format;
          const parser = parserRegistry.get(parserName);
          trees.push(await parser.parse(safePath));
        }

        let mode: Exclude<DistillMode, "auto">;
        if (body.mode && body.mode !== "auto") {
          mode = body.mode as Exclude<DistillMode, "auto">;
        } else if (trees.length > 1) {
          mode = classifyMulti(trees);
        } else {
          mode = classify(trees[0]);
        }

        const analyzerName = body.analyzer ?? "claude-code";
        const analyzer = analyzerRegistry.get(analyzerName);
        const result =
          trees.length > 1
            ? await analyzer.analyzeMulti(trees, mode)
            : await analyzer.analyze(trees[0], mode);

        // Check for duplicates
        const dups = await findDuplicates(result);
        const resultWithMeta = dups.length > 0
          ? { ...result, _duplicates: dups }
          : result;

        await updatePendingStatus(id, "pending", undefined, resultWithMeta);
      } catch (err: any) {
        console.error(`Distill ${id} failed:`, err.message);
        await updatePendingStatus(id, "error" as any, undefined, { error: err.message });
      }
    })();

    return c.json({ id, status: "processing" });
  } catch (err: any) {
    console.error("Distill error:", err.message);
    return c.json({ error: err.message ?? "Distillation failed" }, 500);
  }
});

// List pending
distill.get("/pending", async (c) => {
  const items = await listPending();
  return c.json(items);
});

// Get a distill result
distill.get("/:id", async (c) => {
  const item = await getPending(c.req.param("id"));
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

// Edit a distill result (persist changes)
distill.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json<{ resultData: any }>();
    const item = await getPending(id);
    if (!item) return c.json({ error: "Not found" }, 404);

    await updatePendingStatus(id, "editing", undefined, body.resultData);
    return c.json({ ok: true });
  } catch (err: any) {
    return c.json({ error: err.message ?? "Edit failed" }, 500);
  }
});

// Commit a distill result to a sink
distill.post("/:id/commit", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json<{
      sink: string;
      outputPath?: string;
    }>();

    const item = await getPending(id);
    if (!item) return c.json({ error: "Not found" }, 404);

    const sinkName = body.sink ?? "claude-md";
    const outputPath = body.outputPath ?? "./CLAUDE.md";

    // Validate write path for file-based sinks
    if (sinkName === "claude-md" || sinkName === "file") {
      await validateWritePath(outputPath);
    }

    await commitToSink(item.resultData, { sink: sinkName, outputPath });

    await updatePendingStatus(id, "committed", sinkName);
    return c.json({ ok: true, committedTo: sinkName });
  } catch (err: any) {
    return c.json({ error: err.message ?? "Commit failed" }, 500);
  }
});

// Discard
distill.delete("/:id", async (c) => {
  await discardPending(c.req.param("id"));
  return c.json({ ok: true });
});

export { distill };
