import Database from "better-sqlite3";
import { readdir, stat, access } from "fs/promises";
import { join } from "path";
import { homedir } from "os";
import type { Message, MessageTree, ToolUse } from "@sojourn/shared";
import type { BaseParser } from "./base.js";

interface OpenCodeSession {
  id: string;
  title: string;
  directory: string;
  parent_id: string | null;
  time_created: number;
}

interface OpenCodeMessage {
  id: string;
  session_id: string;
  time_created: number;
  data: string; // JSON
}

interface OpenCodePart {
  id: string;
  message_id: string;
  session_id: string;
  time_created: number;
  data: string; // JSON
}

export class OpenCodeParser implements BaseParser {
  readonly agent = "opencode";
  readonly supportedVersions = "*";

  async parse(path: string): Promise<MessageTree> {
    const db = new Database(path, { readonly: true });

    try {
      // Extract session ID from the path or get the most recent session
      const session = db
        .prepare("SELECT * FROM session ORDER BY time_created DESC LIMIT 1")
        .get() as OpenCodeSession | undefined;

      if (!session) {
        throw new Error("No sessions found in database");
      }

      // Get all messages for this session
      const rawMessages = db
        .prepare(
          "SELECT * FROM message WHERE session_id = ? ORDER BY time_created ASC"
        )
        .all(session.id) as OpenCodeMessage[];

      // Get all parts
      const rawParts = db
        .prepare("SELECT * FROM part WHERE session_id = ? ORDER BY time_created ASC")
        .all(session.id) as OpenCodePart[];

      // Group parts by message
      const partsByMessage = new Map<string, OpenCodePart[]>();
      for (const part of rawParts) {
        if (!partsByMessage.has(part.message_id)) {
          partsByMessage.set(part.message_id, []);
        }
        partsByMessage.get(part.message_id)!.push(part);
      }

      // Build messages
      const messages = new Map<string, Message>();
      const rootIds: string[] = [];

      for (const raw of rawMessages) {
        const data = JSON.parse(raw.data);
        const parts = partsByMessage.get(raw.id) ?? [];
        const content = this.extractContent(parts);
        const toolUses = this.extractToolUses(parts);
        const role = data.role === "user" ? "user" as const : "assistant" as const;

        const message: Message = {
          id: raw.id,
          parentId: data.parentID ?? null,
          role,
          content,
          toolUses,
          isSidechain: false, // opencode uses session-level fork, not message-level sidechain
          timestamp: new Date(raw.time_created),
        };

        messages.set(message.id, message);

        if (!message.parentId || !messages.has(message.parentId)) {
          rootIds.push(message.id);
        }
      }

      return {
        sessionId: session.id,
        messages,
        rootIds,
      };
    } finally {
      db.close();
    }
  }

  async detectVersion(path: string): Promise<string | null> {
    try {
      const db = new Database(path, { readonly: true });
      const session = db
        .prepare("SELECT version FROM session LIMIT 1")
        .get() as { version?: string } | undefined;
      db.close();
      return session?.version ?? null;
    } catch {
      return null;
    }
  }

  private extractContent(parts: OpenCodePart[]): string {
    const textParts: string[] = [];

    for (const part of parts) {
      const data = JSON.parse(part.data);
      if (data.type === "text" && data.text) {
        textParts.push(data.text);
      }
    }

    return textParts.join("\n");
  }

  private extractToolUses(parts: OpenCodePart[]): ToolUse[] {
    const tools: ToolUse[] = [];

    for (const part of parts) {
      const data = JSON.parse(part.data);
      if (data.type === "tool-invocation" || data.type === "tool-result") {
        tools.push({
          name: data.toolName ?? data.name ?? "unknown",
          input: data.args ?? data.input ?? {},
          output: data.result ?? data.output,
        });
      }
    }

    return tools;
  }

  /**
   * Find the opencode database path
   */
  static findDatabasePath(): string {
    // XDG data dir
    const xdgData =
      process.env.XDG_DATA_HOME ?? join(homedir(), ".local", "share");
    return join(xdgData, "opencode", "opencode.db");
  }
}
