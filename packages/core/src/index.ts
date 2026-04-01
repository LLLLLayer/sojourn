export { Registry } from "./registry.js";
export { ClaudeCodeParser } from "./parser/claude.js";
export { ClaudeCodeAnalyzer } from "./analyzer/claude-code.js";
export { ClaudeAnalyzer } from "./analyzer/claude-api.js";
export { classify, classifyMulti } from "./distiller/classifier.js";
export { renderPrompt } from "./prompts/loader.js";
export type { BaseParser } from "./parser/base.js";
export type { BaseAnalyzer } from "./analyzer/base.js";

import { Registry } from "./registry.js";
import type { BaseParser } from "./parser/base.js";
import type { BaseAnalyzer } from "./analyzer/base.js";
import { ClaudeCodeParser } from "./parser/claude.js";
import { ClaudeCodeAnalyzer } from "./analyzer/claude-code.js";
import { ClaudeAnalyzer } from "./analyzer/claude-api.js";

export const parserRegistry = new Registry<BaseParser>();
parserRegistry.register("claude-code", ClaudeCodeParser);

export const analyzerRegistry = new Registry<BaseAnalyzer>();
analyzerRegistry.register("claude-code", ClaudeCodeAnalyzer);
analyzerRegistry.register("claude-api", ClaudeAnalyzer);
