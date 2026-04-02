import Anthropic from "@anthropic-ai/sdk";
import type { MessageTree, AnalysisResult, DistillMode } from "@sojourn/shared";
import type { BaseAnalyzer } from "./base.js";
import { formatConversation, parseJSON, buildPrompt } from "./common.js";

interface ClaudeAnalyzerOptions {
  apiKey?: string;
  model?: string;
}

export class ClaudeAnalyzer implements BaseAnalyzer {
  private client: Anthropic;
  private model: string;

  constructor(options: ClaudeAnalyzerOptions = {}) {
    this.client = new Anthropic({
      apiKey: options.apiKey ?? process.env.ANTHROPIC_API_KEY,
    });
    this.model = options.model ?? "claude-sonnet-4-20250514";
  }

  async analyze(
    tree: MessageTree,
    mode: Exclude<DistillMode, "auto">
  ): Promise<AnalysisResult> {
    const prompt = await buildPrompt(mode, formatConversation(tree));
    const text = await this.callAPI(prompt);
    return {
      type: mode,
      sessionIds: [tree.sessionId],
      createdAt: new Date(),
      ...parseJSON(text),
    } as AnalysisResult;
  }

  async analyzeMulti(
    trees: MessageTree[],
    mode: Exclude<DistillMode, "auto">
  ): Promise<AnalysisResult> {
    const conversation = trees
      .map((t, i) => `=== Session ${i + 1} (${t.sessionId}) ===\n${formatConversation(t)}`)
      .join("\n\n");
    const prompt = await buildPrompt(mode, conversation);
    const text = await this.callAPI(prompt);
    return {
      type: mode,
      sessionIds: trees.map((t) => t.sessionId),
      createdAt: new Date(),
      ...parseJSON(text),
    } as AnalysisResult;
  }

  private async callAPI(prompt: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });
    return response.content[0].type === "text" ? response.content[0].text : "";
  }
}
