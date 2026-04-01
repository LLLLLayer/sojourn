export { Registry } from "./registry.js";
export { ClaudeCodeParser } from "./parser/claude.js";
export { ClaudeCodeAnalyzer } from "./analyzer/claude-code.js";
export { ClaudeAnalyzer } from "./analyzer/claude-api.js";
export { ClaudeMdSink } from "./sink/claude-md.js";
export { FileSink } from "./sink/file.js";
export { classify, classifyMulti } from "./distiller/classifier.js";
export { renderPrompt } from "./prompts/loader.js";
export {
  savePending,
  listPending,
  getPending,
  updatePendingStatus,
  discardPending,
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
} from "./config.js";
export type { BaseParser } from "./parser/base.js";
export type { BaseAnalyzer } from "./analyzer/base.js";
export type { BaseSink } from "./sink/base.js";

import { Registry } from "./registry.js";
import type { BaseParser } from "./parser/base.js";
import type { BaseAnalyzer } from "./analyzer/base.js";
import type { BaseSink } from "./sink/base.js";
import { ClaudeCodeParser } from "./parser/claude.js";
import { ClaudeCodeAnalyzer } from "./analyzer/claude-code.js";
import { ClaudeAnalyzer } from "./analyzer/claude-api.js";
import { ClaudeMdSink } from "./sink/claude-md.js";
import { FileSink } from "./sink/file.js";

export const parserRegistry = new Registry<BaseParser>();
parserRegistry.register("claude-code", ClaudeCodeParser);

export const analyzerRegistry = new Registry<BaseAnalyzer>();
analyzerRegistry.register("claude-code", ClaudeCodeAnalyzer);
analyzerRegistry.register("claude-api", ClaudeAnalyzer);

export const sinkRegistry = new Registry<BaseSink>();
// Sinks require constructor args, so they're created directly rather than via registry
