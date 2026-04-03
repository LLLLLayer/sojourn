import { extname } from "path";

export type DetectedFormat = "claude-code" | "opencode" | "cursor" | "unknown";

/**
 * Auto-detect log format from file path and content.
 */
export async function detectFormat(path: string): Promise<DetectedFormat> {
  const ext = extname(path).toLowerCase();

  // Cursor workspace state
  if (ext === ".vscdb" || path.includes("state.vscdb")) {
    return "cursor";
  }

  // SQLite files → opencode
  if (ext === ".db" || ext === ".sqlite" || ext === ".sqlite3") {
    return "opencode";
  }

  // JSONL → Claude Code
  if (ext === ".jsonl") {
    return "claude-code";
  }

  // No extension or ambiguous — peek at content
  try {
    const head = await readFirstBytes(path, 512);

    // SQLite magic header: "SQLite format 3\000"
    if (head.startsWith("SQLite format 3")) {
      return "opencode";
    }

    // Try parsing as JSON line (Claude Code JSONL)
    const firstLine = head.split("\n")[0];
    if (firstLine) {
      try {
        const obj = JSON.parse(firstLine);
        if (obj.uuid || obj.sessionId || obj.type) {
          return "claude-code";
        }
      } catch {
        // Not JSON
      }
    }
  } catch {
    // Can't read file
  }

  return "unknown";
}

async function readFirstBytes(path: string, bytes: number): Promise<string> {
  const { open } = await import("fs/promises");
  const fh = await open(path, "r");
  const buf = Buffer.alloc(bytes);
  await fh.read(buf, 0, bytes, 0);
  await fh.close();
  return buf.toString("utf-8");
}
