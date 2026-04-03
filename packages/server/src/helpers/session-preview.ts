import { readdir } from "fs/promises";
import { join } from "path";
import { homedir } from "os";

const CHUNK = 4096;

export async function getPreview(
  filePath: string
): Promise<{ firstMsg: string | null; lastMsg: string | null; lineCount: number }> {
  try {
    const { open: fsOpen } = await import("fs/promises");
    const fh = await fsOpen(filePath, "r");
    const fileStat = await fh.stat();
    const fileSize = fileStat.size;
    const lineCount = Math.max(1, Math.round(fileSize / 200));

    const headBuf = Buffer.alloc(Math.min(CHUNK, fileSize));
    await fh.read(headBuf, 0, headBuf.length, 0);
    const headLines = headBuf.toString("utf-8").split("\n").filter(Boolean);

    let tailLines: string[] = [];
    if (fileSize > CHUNK) {
      const tailBuf = Buffer.alloc(CHUNK);
      await fh.read(tailBuf, 0, CHUNK, fileSize - CHUNK);
      tailLines = tailBuf.toString("utf-8").split("\n").filter(Boolean);
    }
    await fh.close();

    let firstMsg: string | null = null;
    let lastMsg: string | null = null;

    for (const line of headLines) {
      try {
        const entry = JSON.parse(line);
        if (!isUserMessage(entry)) continue;
        const text = extractText(entry);
        if (text && text.length > 2) { firstMsg = text.slice(0, 120); break; }
      } catch { /* skip */ }
    }

    for (let i = tailLines.length - 1; i >= 0; i--) {
      try {
        const entry = JSON.parse(tailLines[i]);
        if (!isUserOrAssistantMessage(entry)) continue;
        const text = extractText(entry);
        if (text && text.length > 2 && text.slice(0, 120) !== firstMsg) { lastMsg = text.slice(0, 120); break; }
      } catch { /* skip */ }
    }

    return { firstMsg, lastMsg, lineCount };
  } catch {
    return { firstMsg: null, lastMsg: null, lineCount: 0 };
  }
}

export async function findSession(sessionId: string): Promise<string | null> {
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

function isUserMessage(entry: any): boolean {
  return entry.type === "user" && entry.message?.role === "user";
}

function isUserOrAssistantMessage(entry: any): boolean {
  const role = entry.message?.role;
  const type = entry.type;
  if (type === "system" || type === "result") return false;
  return role === "user" || role === "assistant" || type === "user" || type === "assistant";
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
