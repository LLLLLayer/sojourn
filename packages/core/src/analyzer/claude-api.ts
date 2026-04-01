import Anthropic from "@anthropic-ai/sdk";
import type { MessageTree, AnalysisResult, DistillMode } from "@sojourn/shared";
import { getMainChain } from "@sojourn/shared";
import type { BaseAnalyzer } from "./base.js";
import { renderPrompt } from "../prompts/loader.js";

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
    const conversation = this.formatConversation(tree);
    const promptName = this.getPromptName(mode);
    const prompt = await renderPrompt(promptName, { conversation });

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const data = this.parseJSON(text);

    return {
      type: mode,
      sessionIds: [tree.sessionId],
      createdAt: new Date(),
      ...data,
    } as AnalysisResult;
  }

  async analyzeMulti(
    trees: MessageTree[],
    mode: Exclude<DistillMode, "auto">
  ): Promise<AnalysisResult> {
    const conversations = trees
      .map(
        (t, i) =>
          `=== Session ${i + 1} (${t.sessionId}) ===\n${this.formatConversation(t)}`
      )
      .join("\n\n");

    const promptName = this.getPromptName(mode);
    const prompt = await renderPrompt(promptName, {
      conversation: conversations,
    });

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const data = this.parseJSON(text);

    return {
      type: mode,
      sessionIds: trees.map((t) => t.sessionId),
      createdAt: new Date(),
      ...data,
    } as AnalysisResult;
  }

  private formatConversation(tree: MessageTree): string {
    const chain = getMainChain(tree);
    return chain
      .map((msg) => {
        const role = msg.role.toUpperCase();
        const tools =
          msg.toolUses.length > 0
            ? `\n[Tools: ${msg.toolUses.map((t) => `${t.name}${t.output ? ` → ${t.output.slice(0, 200)}` : ""}`).join(", ")}]`
            : "";
        return `[${role}] (${msg.id})\n${msg.content}${tools}`;
      })
      .join("\n\n---\n\n");
  }

  private getPromptName(
    mode: Exclude<DistillMode, "auto">
  ): string {
    const map: Record<string, string> = {
      thought_tree: "thought-tree",
      sop: "sop",
      workflow: "workflow",
    };
    return map[mode] ?? mode;
  }

  private parseJSON(text: string): Record<string, unknown> {
    // Try to extract JSON from response (may be wrapped in markdown code block)
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();

    try {
      return JSON.parse(jsonStr);
    } catch {
      throw new Error(
        `Failed to parse LLM response as JSON:\n${text.slice(0, 500)}`
      );
    }
  }
}
