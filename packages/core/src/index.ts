export { Registry } from "./registry.js";
export { ClaudeCodeParser } from "./parser/claude.js";
export { OpenCodeParser } from "./parser/opencode.js";
export { ClaudeCodeAnalyzer } from "./analyzer/claude-code.js";
export { ClaudeAnalyzer } from "./analyzer/claude-api.js";
export { ClaudeMdSink } from "./sink/claude-md.js";
export { FileSink } from "./sink/file.js";
export { classify, classifyMulti, classifyWithLLM } from "./distiller/classifier.js";
export { detectFormat } from "./parser/detect.js";
export { resolveSessionPath, listSessions } from "./sessions.js";
export type { SessionInfo } from "./sessions.js";
export { renderPrompt } from "./prompts/loader.js";
export {
  savePending,
  listPending,
  getPending,
  updatePendingStatus,
  discardPending,
  setPendingDir,
} from "./store.js";
export {
  installHook,
  uninstallHook,
  isHookInstalled,
  autoAnalyze,
} from "./hooks.js";
export {
  loadConfig,
  saveConfig,
  getConfigValue,
  setConfigValue,
  getConfigPath,
  bindRepo,
  unbindRepo,
  switchRepo,
  getActiveRepo,
} from "./config.js";
export { GitRepoSink } from "./sink/git-repo.js";
export { MemorySink } from "./sink/memory.js";
export { commitToSink } from "./commit.js";
export type { CommitOptions } from "./commit.js";
export type { BaseParser } from "./parser/base.js";
export type { BaseAnalyzer } from "./analyzer/base.js";
export type { BaseSink } from "./sink/base.js";

import { Registry } from "./registry.js";
import type { BaseParser } from "./parser/base.js";
import type { BaseAnalyzer } from "./analyzer/base.js";
import type { BaseSink } from "./sink/base.js";
import { ClaudeCodeParser } from "./parser/claude.js";
import { OpenCodeParser } from "./parser/opencode.js";
import { ClaudeCodeAnalyzer } from "./analyzer/claude-code.js";
import { ClaudeAnalyzer } from "./analyzer/claude-api.js";

export const parserRegistry = new Registry<BaseParser>();
parserRegistry.register("claude-code", ClaudeCodeParser);
parserRegistry.register("opencode", OpenCodeParser);

export const analyzerRegistry = new Registry<BaseAnalyzer>();
analyzerRegistry.register("claude-code", ClaudeCodeAnalyzer);
analyzerRegistry.register("claude-api", ClaudeAnalyzer);

export const sinkRegistry = new Registry<BaseSink>();
// Sinks require constructor args, so they're created directly rather than via registry
