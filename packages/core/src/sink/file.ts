import { writeFile, mkdir } from "fs/promises";
import { dirname } from "path";
import type { AnalysisResult } from "@sojourn/shared";
import type { BaseSink } from "./base.js";
import { formatAsMarkdown } from "../formatter.js";

export class FileSink implements BaseSink {
  readonly name = "file";
  private outputPath: string;
  private format: "json" | "markdown";

  constructor(outputPath: string, format: "json" | "markdown" = "json") {
    this.outputPath = outputPath;
    this.format = format;
  }

  async write(result: AnalysisResult): Promise<void> {
    await mkdir(dirname(this.outputPath), { recursive: true });
    const content =
      this.format === "json"
        ? JSON.stringify(result, null, 2)
        : formatAsMarkdown(result);
    await writeFile(this.outputPath, content, "utf-8");
  }

  async testConnection(): Promise<boolean> {
    return true;
  }
}
