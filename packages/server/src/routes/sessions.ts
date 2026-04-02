import { Hono } from "hono";
import { readFile, readdir, stat, rename, mkdir } from "fs/promises";
import { join, basename } from "path";
import { homedir } from "os";

const TRASH_DIR = join(homedir(), ".sojourn", "trash");
import { parserRegistry, loadConfig, saveConfig } from "@sojourn/core";
import { isLinear, getMainChain, getBranches } from "@sojourn/shared";

const sessions = new Hono();

// List sessions with first/last message preview
sessions.get("/", async (c) => {
  const claudeProjectsDir = join(homedir(), ".claude", "projects");
  const config = await loadConfig();
  const aliases: Record<string, string> = (config as any).sessionAliases ?? {};

  const result: Array<{
    sessionId: string;
    project: string;
    path: string;
    modified: string;
    sizeKB: number;
    alias: string | null;
    firstMessage: string | null;
    lastMessage: string | null;
    messageCount: number;
  }> = [];

  try {
    const projects = await readdir(claudeProjectsDir);
    for (const project of projects) {
      const projectDir = join(claudeProjectsDir, project);
      const projectStat = await stat(projectDir);
      if (!projectStat.isDirectory()) continue;

      // Skip memory directories
      if (project === "memory" || project.endsWith("-memory")) continue;

      const files = await readdir(projectDir);
      for (const file of files.filter((f) => f.endsWith(".jsonl"))) {
        const filePath = join(projectDir, file);
        const fileStat = await stat(filePath);
        const sessionId = file.replace(".jsonl", "");

        // Quick preview: read first and last lines
        const { firstMsg, lastMsg, lineCount } = await getPreview(filePath);

        result.push({
          sessionId,
          project: decodeURIComponent(project).replace(/^-/, "/"),
          path: filePath,
          modified: fileStat.mtime.toISOString(),
          sizeKB: Math.round(fileStat.size / 1024),
          alias: aliases[sessionId] ?? null,
          firstMessage: firstMsg,
          lastMessage: lastMsg,
          messageCount: lineCount,
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

// Get session detail
sessions.get("/:id", async (c) => {
  const sessionId = c.req.param("id");
  try {
    const sessionPath = await findSession(sessionId);
    if (!sessionPath) return c.json({ error: "Session not found" }, 404);

    const parser = parserRegistry.get("claude-code");
    const tree = await parser.parse(sessionPath);

    const mainChain = getMainChain(tree).map((m) => ({
      ...m,
      timestamp: m.timestamp instanceof Date && !isNaN(m.timestamp.getTime())
        ? m.timestamp.toISOString()
        : new Date().toISOString(),
    }));
    const branches = getBranches(tree);

    return c.json({
      sessionId: tree.sessionId,
      messageCount: tree.messages.size,
      isLinear: isLinear(tree),
      branchCount: branches.length,
      messages: mainChain,
    });
  } catch (err: any) {
    console.error(`Session ${sessionId} error:`, err.message);
    return c.json({ error: err.message ?? "Failed to load session" }, 500);
  }
});

// Rename session (set alias)
sessions.put("/:id/alias", async (c) => {
  const sessionId = c.req.param("id");
  const { alias } = await c.req.json<{ alias: string }>();
  const config = await loadConfig();

  if (!(config as any).sessionAliases) {
    (config as any).sessionAliases = {};
  }

  if (alias) {
    (config as any).sessionAliases[sessionId] = alias;
  } else {
    delete (config as any).sessionAliases[sessionId];
  }

  await saveConfig(config);
  return c.json({ ok: true });
});

// Soft-delete session (move to trash)
sessions.delete("/:id", async (c) => {
  const sessionId = c.req.param("id");
  const sessionPath = await findSession(sessionId);
  if (!sessionPath) return c.json({ error: "Session not found" }, 404);

  await mkdir(TRASH_DIR, { recursive: true });
  const trashPath = join(TRASH_DIR, `${Date.now()}-${basename(sessionPath)}`);
  await rename(sessionPath, trashPath);
  return c.json({ ok: true, trashedTo: trashPath });
});

// Soft-delete all sessions in a project
sessions.delete("/project/:projectName", async (c) => {
  const projectName = c.req.param("projectName");
  const claudeProjectsDir = join(homedir(), ".claude", "projects");

  try {
    const projects = await readdir(claudeProjectsDir);
    const match = projects.find((p) => {
      const decoded = decodeURIComponent(p).replace(/^-/, "/");
      return decoded === projectName;
    });
    if (!match) return c.json({ error: "Project not found" }, 404);

    const projectDir = join(claudeProjectsDir, match);
    const files = await readdir(projectDir);
    const jsonlFiles = files.filter((f) => f.endsWith(".jsonl"));

    await mkdir(TRASH_DIR, { recursive: true });
    let count = 0;
    for (const file of jsonlFiles) {
      const trashPath = join(TRASH_DIR, `${Date.now()}-${file}`);
      await rename(join(projectDir, file), trashPath);
      count++;
    }

    return c.json({ ok: true, deleted: count });
  } catch {
    return c.json({ error: "Failed to delete project" }, 500);
  }
});

// --- Helpers ---

async function getPreview(
  filePath: string
): Promise<{ firstMsg: string | null; lastMsg: string | null; lineCount: number }> {
  try {
    const content = await readFile(filePath, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);
    const lineCount = lines.length;

    let firstMsg: string | null = null;
    let lastMsg: string | null = null;

    // Find first user message (skip system/tool messages)
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (!isUserMessage(entry)) continue;
        const text = extractText(entry);
        if (text && text.length > 2) {
          firstMsg = text.slice(0, 120);
          break;
        }
      } catch { /* skip */ }
    }

    // Find last meaningful message
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const entry = JSON.parse(lines[i]);
        if (!isUserOrAssistantMessage(entry)) continue;
        const text = extractText(entry);
        if (text && text.length > 2 && text.slice(0, 120) !== firstMsg) {
          lastMsg = text.slice(0, 120);
          break;
        }
      } catch { /* skip */ }
    }

    return { firstMsg, lastMsg, lineCount };
  } catch {
    return { firstMsg: null, lastMsg: null, lineCount: 0 };
  }
}

function isUserMessage(entry: any): boolean {
  // Must be explicitly a user message, not system or tool result
  if (entry.type === "user" && entry.message?.role === "user") return true;
  if (entry.type === "user" && !entry.message) return false;
  return false;
}

function isUserOrAssistantMessage(entry: any): boolean {
  const role = entry.message?.role;
  const type = entry.type;
  if (type === "system" || type === "result") return false;
  if (role === "user" || role === "assistant") return true;
  if (type === "user" || type === "assistant") return true;
  return false;
}

function extractText(entry: any): string | null {
  const content = entry.message?.content;
  if (typeof content === "string" && content.trim()) return content.trim();
  if (Array.isArray(content)) {
    for (const block of content) {
      if (typeof block === "string" && block.trim()) return block.trim();
      if (block?.type === "text" && block.text?.trim()) return block.text.trim();
    }
  }
  return null;
}

async function findSession(sessionId: string): Promise<string | null> {
  const claudeProjectsDir = join(homedir(), ".claude", "projects");
  try {
    const projects = await readdir(claudeProjectsDir);
    for (const project of projects) {
      const projectDir = join(claudeProjectsDir, project);
      const files = await readdir(projectDir).catch(() => [] as string[]);
      const match = files.find((f) => f.includes(sessionId));
      if (match) return join(projectDir, match);
    }
  } catch { /* */ }
  return null;
}

export { sessions };
