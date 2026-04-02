import { readdir, stat } from "fs/promises";
import { join } from "path";
import { homedir } from "os";
import { loadConfig } from "./config.js";

export interface SessionInfo {
  sessionId: string;
  project: string;
  path: string;
  modified: Date;
  sizeKB: number;
}

/**
 * Resolve a session ID (partial or full) to an absolute file path.
 * Searches all Claude Code project directories.
 */
export async function resolveSessionPath(
  idOrPath: string
): Promise<string> {
  // If it looks like a file path (contains / or .jsonl), return as-is
  if (idOrPath.includes("/") || idOrPath.endsWith(".jsonl") || idOrPath.endsWith(".db")) {
    return idOrPath;
  }

  // Otherwise treat as session ID (partial match)
  const config = await loadConfig();
  const projectsDir = config.agents?.["claude-code"]?.logPath
    ?? join(homedir(), ".claude", "projects");

  try {
    const projects = await readdir(projectsDir);
    const matches: string[] = [];

    for (const project of projects) {
      const projectDir = join(projectsDir, project);
      const projectStat = await stat(projectDir).catch(() => null);
      if (!projectStat?.isDirectory()) continue;

      const files = await readdir(projectDir).catch(() => [] as string[]);
      for (const file of files) {
        if (file.includes(idOrPath) && file.endsWith(".jsonl")) {
          matches.push(join(projectDir, file));
        }
      }
    }

    if (matches.length === 0) {
      throw new Error(`Session not found: ${idOrPath}`);
    }
    if (matches.length > 1) {
      throw new Error(
        `Ambiguous session ID "${idOrPath}", ${matches.length} matches:\n` +
        matches.map((m) => `  ${m}`).join("\n")
      );
    }

    return matches[0];
  } catch (err: any) {
    if (err.message.startsWith("Session not found") || err.message.startsWith("Ambiguous")) {
      throw err;
    }
    throw new Error(`Cannot search sessions: ${err.message}`);
  }
}

/**
 * List all available sessions.
 */
export async function listSessions(): Promise<SessionInfo[]> {
  const config = await loadConfig();
  const projectsDir = config.agents?.["claude-code"]?.logPath
    ?? join(homedir(), ".claude", "projects");

  const results: SessionInfo[] = [];

  try {
    const projects = await readdir(projectsDir);
    for (const project of projects) {
      const projectDir = join(projectsDir, project);
      const projectStat = await stat(projectDir).catch(() => null);
      if (!projectStat?.isDirectory()) continue;

      const files = await readdir(projectDir).catch(() => [] as string[]);
      for (const file of files.filter((f) => f.endsWith(".jsonl"))) {
        const filePath = join(projectDir, file);
        const fileStat = await stat(filePath);
        results.push({
          sessionId: file.replace(".jsonl", ""),
          project: decodeURIComponent(project).replace(/^-/, "/"),
          path: filePath,
          modified: fileStat.mtime,
          sizeKB: Math.round(fileStat.size / 1024),
        });
      }
    }
  } catch {
    // dir doesn't exist
  }

  return results.sort((a, b) => b.modified.getTime() - a.modified.getTime());
}
