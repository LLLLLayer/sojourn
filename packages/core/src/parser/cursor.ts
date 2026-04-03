import { join } from "path";
import { homedir } from "os";
import type { Message, MessageTree, ToolUse } from "@sojourn/shared";
import type { BaseParser } from "./base.js";

/**
 * Cursor stores conversations in workspace state.vscdb (SQLite).
 * Key: "composer.composerData" in ItemTable
 * Structure: { allComposers: [{ composerId, branches: [{ conversation: [...] }] }] }
 *
 * This parser reads the state.vscdb and extracts conversations.
 * Requires better-sqlite3 (same as opencode parser).
 */
export class CursorParser implements BaseParser {
  readonly agent = "cursor";
  readonly supportedVersions = "*";

  async parse(path: string): Promise<MessageTree> {
    // Dynamic import to handle missing better-sqlite3
    const Database = (await import("better-sqlite3")).default;
    const db = new Database(path, { readonly: true });

    try {
      const row = db.prepare(
        "SELECT value FROM ItemTable WHERE key = 'composer.composerData'"
      ).get() as { value: string } | undefined;

      if (!row) throw new Error("No composer data found in Cursor workspace");

      const data = JSON.parse(row.value);
      const composers = data.allComposers ?? [];

      if (composers.length === 0) throw new Error("No conversations found");

      // Find the most recent composer with actual messages
      let bestConversation: any[] = [];
      let bestComposerId = "";

      for (const composer of composers) {
        for (const branch of composer.branches ?? []) {
          const conv = branch.conversation ?? [];
          if (conv.length > bestConversation.length) {
            bestConversation = conv;
            bestComposerId = composer.composerId;
          }
        }
      }

      if (bestConversation.length === 0) {
        throw new Error("No messages found in any conversation");
      }

      // Build MessageTree
      const messages = new Map<string, Message>();
      const rootIds: string[] = [];

      for (let i = 0; i < bestConversation.length; i++) {
        const msg = bestConversation[i];
        const id = msg.id ?? msg.bubbleId ?? `msg-${i}`;
        const parentId = i > 0 ? (bestConversation[i - 1].id ?? bestConversation[i - 1].bubbleId ?? `msg-${i - 1}`) : null;

        const role = this.resolveRole(msg);
        const content = this.extractContent(msg);
        const toolUses = this.extractToolUses(msg);

        const message: Message = {
          id,
          parentId,
          role,
          content,
          toolUses,
          isSidechain: false,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        };

        messages.set(id, message);
        if (!parentId) rootIds.push(id);
      }

      return { sessionId: bestComposerId, messages, rootIds };
    } finally {
      db.close();
    }
  }

  async detectVersion(_path: string): Promise<string | null> {
    return null; // Cursor doesn't store version in state.vscdb
  }

  private resolveRole(msg: any): Message["role"] {
    if (msg.type === 1 || msg.sender === "user" || msg.role === "user") return "user";
    if (msg.type === 2 || msg.sender === "assistant" || msg.role === "assistant") return "assistant";
    return "assistant";
  }

  private extractContent(msg: any): string {
    if (typeof msg.text === "string") return msg.text;
    if (typeof msg.content === "string") return msg.content;
    if (typeof msg.message === "string") return msg.message;
    if (Array.isArray(msg.content)) {
      return msg.content
        .map((b: any) => (typeof b === "string" ? b : b.text ?? ""))
        .filter(Boolean)
        .join("\n");
    }
    return "";
  }

  private extractToolUses(msg: any): ToolUse[] {
    const tools: ToolUse[] = [];
    if (msg.toolCalls) {
      for (const tc of msg.toolCalls) {
        tools.push({
          name: tc.name ?? tc.function?.name ?? "unknown",
          input: tc.arguments ?? tc.function?.arguments ?? {},
          output: tc.result,
        });
      }
    }
    return tools;
  }

  /**
   * Find Cursor workspace state databases.
   */
  static findDatabases(): string[] {
    const wsDir = join(
      homedir(),
      "Library",
      "Application Support",
      "Cursor",
      "User",
      "workspaceStorage"
    );
    // Would need to readdir and find state.vscdb files
    return [wsDir];
  }
}
