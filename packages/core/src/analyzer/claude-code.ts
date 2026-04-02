import { spawn } from "child_process";
import type { MessageTree, AnalysisResult, DistillMode } from "@sojourn/shared";
import type { BaseAnalyzer } from "./base.js";
import { formatConversation, parseJSON, buildPrompt } from "./common.js";

export class ClaudeCodeAnalyzer implements BaseAnalyzer {
  async analyze(
    tree: MessageTree,
    mode: Exclude<DistillMode, "auto">
  ): Promise<AnalysisResult> {
    const prompt = await buildPrompt(mode, formatConversation(tree));
    const text = await this.callClaude(prompt);
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
    const text = await this.callClaude(prompt);
    return {
      type: mode,
      sessionIds: trees.map((t) => t.sessionId),
      createdAt: new Date(),
      ...parseJSON(text),
    } as AnalysisResult;
  }

  private callClaude(prompt: string): Promise<string> {
    const TIMEOUT_MS = 120_000;

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

      proc.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
      proc.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });

      proc.on("error", (err: NodeJS.ErrnoException) => {
        clearTimeout(timer);
        if (timedOut) return;
        if (err.code === "ENOENT") {
          reject(new Error("Claude Code CLI not found. Install: https://docs.anthropic.com/en/docs/claude-code"));
        } else {
          reject(new Error(`Claude Code CLI failed: ${err.message}`));
        }
      });

      proc.on("close", (code) => {
        clearTimeout(timer);
        if (timedOut) return;
        if (code !== 0) {
          reject(new Error(`Claude Code exited with code ${code}: ${stderr}`));
        } else {
          resolve(stdout);
        }
      });

      proc.stdin.write(prompt);
      proc.stdin.end();
    });
  }
}
