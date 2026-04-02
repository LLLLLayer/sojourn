import type { AnalysisResult } from "@sojourn/shared";
import { ClaudeMdSink } from "./sink/claude-md.js";
import { FileSink } from "./sink/file.js";
import { GitRepoSink } from "./sink/git-repo.js";
import { MemorySink } from "./sink/memory.js";
import { CursorRulesSink } from "./sink/cursorrules.js";
import { getActiveRepo } from "./config.js";

export interface CommitOptions {
  sink: string;
  outputPath?: string;
}

/**
 * Unified sink commit: write an analysis result to a named sink.
 */
export async function commitToSink(
  result: AnalysisResult,
  options: CommitOptions
): Promise<void> {
  const { sink, outputPath = "./CLAUDE.md" } = options;

  switch (sink) {
    case "claude-md": {
      await new ClaudeMdSink(outputPath).write(result);
      break;
    }
    case "file": {
      const format = outputPath.endsWith(".json") ? "json" as const : "markdown" as const;
      await new FileSink(outputPath, format).write(result);
      break;
    }
    case "git-repo": {
      const repo = await getActiveRepo();
      if (!repo) throw new Error("No active repo. Run: sojourn repo bind <name> <url>");
      await new GitRepoSink({ repoUrl: repo.url, repoName: repo.name }).write(result);
      break;
    }
    case "memory": {
      await new MemorySink().write(result);
      break;
    }
    case "cursorrules": {
      await new CursorRulesSink(outputPath !== "./CLAUDE.md" ? outputPath : ".cursorrules").write(result);
      break;
    }
    default:
      throw new Error(`Unknown sink: ${sink}`);
  }
}
