import { writeFile, readFile, mkdir } from "fs/promises";
import { dirname } from "path";
import type { AnalysisResult } from "@sojourn/shared";
import type { BaseSink } from "./base.js";

/**
 * Writes distilled knowledge as .cursorrules format.
 * Cursor AI reads this file for project-specific coding rules.
 */
export class CursorRulesSink implements BaseSink {
  readonly name = "cursorrules";
  private filePath: string;

  constructor(filePath: string = ".cursorrules") {
    this.filePath = filePath;
  }

  async write(result: AnalysisResult): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });

    const rule = this.formatRule(result);

    let existing = "";
    try {
      existing = await readFile(this.filePath, "utf-8");
    } catch {
      // File doesn't exist
    }

    const marker = "# --- sojourn auto-generated ---";
    if (existing.includes(marker)) {
      // Append before end
      const idx = existing.lastIndexOf(marker);
      const before = existing.slice(0, idx + marker.length);
      await writeFile(this.filePath, before + "\n\n" + rule, "utf-8");
    } else {
      const content = existing
        ? existing + "\n\n" + marker + "\n\n" + rule
        : marker + "\n\n" + rule;
      await writeFile(this.filePath, content, "utf-8");
    }
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  private formatRule(result: AnalysisResult): string {
    if (result.type === "sop") {
      const sop = result as any;
      const steps = (sop.steps ?? [])
        .map((s: any, i: number) => `${i + 1}. ${s.description}`)
        .join("\n");
      return `# ${sop.title}\n\n${steps}\n`;
    }

    if (result.type === "thought_tree") {
      const tree = result as any;
      const rules: string[] = [];

      // Extract pruning reasons as "don't do" rules
      for (const node of tree.nodes ?? []) {
        if (node.nodeType === "pruning" && node.reason) {
          rules.push(`- Do NOT: ${node.label} — ${node.reason}`);
        }
        if (node.nodeType === "convergence" && node.reason) {
          rules.push(`- PREFER: ${node.label} — ${node.reason}`);
        }
      }

      return `# ${tree.rootQuestion}\n\n${rules.join("\n")}\n`;
    }

    if (result.type === "workflow") {
      const wf = result as any;
      return `# ${wf.patternName}\n\nWhen: ${wf.trigger}\nDo: ${wf.recommendation}\n`;
    }

    return "";
  }
}
