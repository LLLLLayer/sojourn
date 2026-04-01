import { Hono } from "hono";
import { readdir, stat } from "fs/promises";
import { join } from "path";
import { homedir } from "os";
import { parserRegistry } from "@sojourn/core";
import { isLinear, getMainChain, getBranches } from "@sojourn/shared";

const sessions = new Hono();

sessions.get("/", async (c) => {
  const claudeProjectsDir = join(homedir(), ".claude", "projects");
  const result: Array<{
    sessionId: string;
    project: string;
    path: string;
    modified: string;
    sizeKB: number;
  }> = [];

  try {
    const projects = await readdir(claudeProjectsDir);
    for (const project of projects) {
      const projectDir = join(claudeProjectsDir, project);
      const projectStat = await stat(projectDir);
      if (!projectStat.isDirectory()) continue;

      const files = await readdir(projectDir);
      for (const file of files.filter((f) => f.endsWith(".jsonl"))) {
        const filePath = join(projectDir, file);
        const fileStat = await stat(filePath);
        result.push({
          sessionId: file.replace(".jsonl", ""),
          project: decodeURIComponent(project).replace(/^-/, "/"),
          path: filePath,
          modified: fileStat.mtime.toISOString(),
          sizeKB: Math.round(fileStat.size / 1024),
        });
      }
    }
  } catch {
    // dir doesn't exist
  }

  result.sort(
    (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime()
  );
  return c.json(result);
});

sessions.get("/:id", async (c) => {
  const sessionId = c.req.param("id");
  const claudeProjectsDir = join(homedir(), ".claude", "projects");

  // Find the session file
  let sessionPath: string | null = null;
  try {
    const projects = await readdir(claudeProjectsDir);
    for (const project of projects) {
      const projectDir = join(claudeProjectsDir, project);
      const files = await readdir(projectDir).catch(() => [] as string[]);
      const match = files.find((f) => f.includes(sessionId));
      if (match) {
        sessionPath = join(projectDir, match);
        break;
      }
    }
  } catch {
    return c.json({ error: "Sessions directory not found" }, 404);
  }

  if (!sessionPath) {
    return c.json({ error: "Session not found" }, 404);
  }

  const parser = parserRegistry.get("claude-code");
  const tree = await parser.parse(sessionPath);

  const mainChain = getMainChain(tree).map((m) => ({
    ...m,
    timestamp: m.timestamp.toISOString(),
  }));
  const branches = getBranches(tree);

  return c.json({
    sessionId: tree.sessionId,
    messageCount: tree.messages.size,
    isLinear: isLinear(tree),
    branchCount: branches.length,
    messages: mainChain,
  });
});

export { sessions };
