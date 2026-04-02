import { spawn } from "child_process";
import type { MessageTree, AnalysisResult, DistillMode } from "@sojourn/shared";
import { getMainChain } from "@sojourn/shared";
import type { BaseAnalyzer } from "./base.js";
import { renderPrompt } from "../prompts/loader.js";
import { loadConfig } from "../config.js";

const LANG_INSTRUCTIONS: Record<string, string> = {
  zh: "IMPORTANT: Output ALL text content (titles, labels, descriptions, reasons, steps) in Chinese (中文). JSON keys remain in English.",
  en: "Output all text content in English.",
};

export class ClaudeCodeAnalyzer implements BaseAnalyzer {
  async analyze(
    tree: MessageTree,
    mode: Exclude<DistillMode, "auto">
  ): Promise<AnalysisResult> {
    const config = await loadConfig();
    const langInstruction = LANG_INSTRUCTIONS[config.language] ?? LANG_INSTRUCTIONS.en;
    const conversation = this.formatConversation(tree);
    const promptName = this.getPromptName(mode);
    const prompt = await renderPrompt(promptName, { conversation, language: langInstruction });

    const text = await this.callClaude(prompt);
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
    const config = await loadConfig();
    const langInstruction = LANG_INSTRUCTIONS[config.language] ?? LANG_INSTRUCTIONS.en;
    const conversations = trees
      .map(
        (t, i) =>
          `=== Session ${i + 1} (${t.sessionId}) ===\n${this.formatConversation(t)}`
      )
      .join("\n\n");

    const promptName = this.getPromptName(mode);
    const prompt = await renderPrompt(promptName, {
      conversation: conversations,
      language: langInstruction,
    });

    const text = await this.callClaude(prompt);
    const data = this.parseJSON(text);

    return {
      type: mode,
      sessionIds: trees.map((t) => t.sessionId),
      createdAt: new Date(),
      ...data,
    } as AnalysisResult;
  }

  private callClaude(prompt: string): Promise<string> {
    const TIMEOUT_MS = 120_000; // 2 minutes

    return new Promise((resolve, reject) => {
      const proc = spawn("claude", ["-p", "--output-format", "text"], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      let timedOut = false;

      const timer = setTimeout(() => {
        timedOut = true;
        proc.kill("SIGTERM");
        reject(new Error("Claude Code CLI timed out after 120s"));
      }, TIMEOUT_MS);

      proc.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      proc.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      proc.on("error", (err: NodeJS.ErrnoException) => {
        clearTimeout(timer);
        if (timedOut) return;
        if (err.code === "ENOENT") {
          reject(
            new Error(
              "Claude Code CLI not found. Install it: https://docs.anthropic.com/en/docs/claude-code"
            )
          );
        } else {
          reject(new Error(`Claude Code CLI failed: ${err.message}`));
        }
      });

      proc.on("close", (code) => {
        clearTimeout(timer);
        if (timedOut) return;
        if (code !== 0) {
          reject(
            new Error(`Claude Code exited with code ${code}: ${stderr}`)
          );
        } else {
          resolve(stdout);
        }
      });

      proc.stdin.write(prompt);
      proc.stdin.end();
    });
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

  private getPromptName(mode: Exclude<DistillMode, "auto">): string {
    const map: Record<string, string> = {
      thought_tree: "thought-tree",
      sop: "sop",
      workflow: "workflow",
    };
    return map[mode] ?? mode;
  }

  private parseJSON(text: string): Record<string, unknown> {
    // Strategy 1: extract from markdown code block
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1].trim());
      } catch { /* try next */ }
    }

    // Strategy 2: find first { ... } or [ ... ] block
    const braceStart = text.indexOf("{");
    const braceEnd = text.lastIndexOf("}");
    if (braceStart !== -1 && braceEnd > braceStart) {
      try {
        return JSON.parse(text.slice(braceStart, braceEnd + 1));
      } catch { /* try next */ }
    }

    // Strategy 3: try the whole text as-is
    try {
      return JSON.parse(text.trim());
    } catch {
      throw new Error(
        `Failed to parse response as JSON:\n${text.slice(0, 500)}`
      );
    }
  }
}
