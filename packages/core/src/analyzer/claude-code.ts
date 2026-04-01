import { spawn } from "child_process";
import type { MessageTree, AnalysisResult, DistillMode } from "@sojourn/shared";
import { getMainChain } from "@sojourn/shared";
import type { BaseAnalyzer } from "./base.js";
import { renderPrompt } from "../prompts/loader.js";

export class ClaudeCodeAnalyzer implements BaseAnalyzer {
  async analyze(
    tree: MessageTree,
    mode: Exclude<DistillMode, "auto">
  ): Promise<AnalysisResult> {
    const conversation = this.formatConversation(tree);
    const promptName = this.getPromptName(mode);
    const prompt = await renderPrompt(promptName, { conversation });

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
    return new Promise((resolve, reject) => {
      const proc = spawn("claude", ["-p", "--output-format", "text"], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      proc.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      proc.on("error", (err: NodeJS.ErrnoException) => {
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
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();

    try {
      return JSON.parse(jsonStr);
    } catch {
      throw new Error(
        `Failed to parse response as JSON:\n${text.slice(0, 500)}`
      );
    }
  }
}
