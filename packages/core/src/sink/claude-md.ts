import { readFile, writeFile, mkdir, access } from "fs/promises";
import { dirname } from "path";
import type { AnalysisResult } from "@sojourn/shared";
import type { BaseSink } from "./base.js";
import { formatAsSection } from "../formatter.js";

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
    return formatAsSection(result);
  }
}
