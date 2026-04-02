import { readFile, writeFile, mkdir, access } from "fs/promises";
import { dirname } from "path";
import type { AnalysisResult } from "@sojourn/shared";
import type { BaseSink } from "./base.js";

export class ClaudeMdSink implements BaseSink {
  readonly name = "claude-md";
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async write(result: AnalysisResult): Promise<void> {
    const section = this.formatSection(result);

    let existing = "";
    try {
      existing = await readFile(this.filePath, "utf-8");
    } catch {
      // File doesn't exist yet, create it
      await mkdir(dirname(this.filePath), { recursive: true });
    }

    const marker = "<!-- sojourn:auto-generated -->";
    const endMarker = "<!-- sojourn:end -->";

    if (existing.includes(marker)) {
      // Append inside existing sojourn section
      const endIdx = existing.indexOf(endMarker);
      if (endIdx !== -1) {
        const before = existing.slice(0, endIdx);
        const after = existing.slice(endIdx);
        await writeFile(
          this.filePath,
          before + section + "\n" + after,
          "utf-8"
        );
      } else {
        await writeFile(
          this.filePath,
          existing + "\n" + section,
          "utf-8"
        );
      }
    } else {
      // Add sojourn section at the end
      const sojournBlock = `\n${marker}\n## Sojourn 知识提炼\n\n${section}\n${endMarker}\n`;
      await writeFile(
        this.filePath,
        existing + sojournBlock,
        "utf-8"
      );
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await access(dirname(this.filePath));
      return true;
    } catch {
      return false;
    }
  }

  private formatSection(result: AnalysisResult): string {
    const date = new Date().toISOString().slice(0, 10);

    if (result.type === "sop") {
      const sop = result as any;
      const steps = sop.steps
        .map(
          (s: any, i: number) =>
            `${i + 1}. ${s.description}${s.failureBranch ? `\n   - 失败处理: ${s.failureBranch}` : ""}`
        )
        .join("\n");
      return `### ${sop.title}\n_${date} | SOP | session: ${result.sessionIds.join(", ")}_\n\n${steps}\n`;
    }

    if (result.type === "thought_tree") {
      const tree = result as any;
      const prunings = tree.nodes
        .filter((n: any) => n.nodeType === "pruning" && n.reason)
        .map((n: any) => `- ❌ ${n.label}: ${n.reason}`);
      const convergences = tree.nodes
        .filter((n: any) => n.nodeType === "convergence" && n.reason)
        .map((n: any) => `- ✅ ${n.label}: ${n.reason}`);

      const lines = [`### ${tree.rootQuestion}`];
      lines.push(
        `_${date} | 思维树 | session: ${result.sessionIds.join(", ")}_\n`
      );
      if (convergences.length) {
        lines.push("**决策**:");
        lines.push(...convergences);
      }
      if (prunings.length) {
        lines.push("\n**放弃的方案**:");
        lines.push(...prunings);
      }
      return lines.join("\n") + "\n";
    }

    return `### 知识提炼\n_${date} | ${result.type}_\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\`\n`;
  }
}
