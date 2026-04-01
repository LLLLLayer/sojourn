import { readFile } from "fs/promises";
import type { Message, MessageTree, ToolUse } from "@sojourn/shared";
import type { BaseParser } from "./base.js";

interface RawLogEntry {
  uuid?: string;
  parentUuid?: string | null;
  sessionId?: string;
  timestamp?: string;
  type?: string;
  message?: {
    role?: string;
    content?: unknown;
    id?: string;
    model?: string;
  };
  toolUse?: {
    name?: string;
    input?: Record<string, unknown>;
  };
  toolUseResult?: {
    content?: string;
  };
  isSidechain?: boolean;
  costUSD?: number;
  durationMs?: number;
  cwd?: string;
  version?: string;
}

export class ClaudeCodeParser implements BaseParser {
  readonly agent = "claude-code";
  readonly supportedVersions = "*";

  async parse(path: string): Promise<MessageTree> {
    const content = await readFile(path, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);

    // Parse all lines, dedup by uuid (keep last occurrence)
    const entryMap = new Map<string, RawLogEntry>();
    const entryOrder: string[] = [];

    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as RawLogEntry;
        if (!entry.uuid) continue;

        if (!entryMap.has(entry.uuid)) {
          entryOrder.push(entry.uuid);
        }
        entryMap.set(entry.uuid, entry);
      } catch {
        // Skip malformed lines
      }
    }

    // Build messages
    const messages = new Map<string, Message>();
    const rootIds: string[] = [];
    let sessionId = "";

    for (const uuid of entryOrder) {
      const entry = entryMap.get(uuid)!;

      if (!sessionId && entry.sessionId) {
        sessionId = entry.sessionId;
      }

      const role = this.resolveRole(entry);
      if (!role) continue;

      const toolUses = this.extractToolUses(entry);
      const content = this.extractContent(entry);

      const message: Message = {
        id: entry.uuid!,
        parentId: entry.parentUuid ?? null,
        role,
        content,
        toolUses,
        isSidechain: entry.isSidechain ?? false,
        timestamp: entry.timestamp
          ? new Date(entry.timestamp)
          : new Date(),
      };

      messages.set(message.id, message);

      if (!message.parentId || !entryMap.has(message.parentId)) {
        rootIds.push(message.id);
      }
    }

    return { sessionId, messages, rootIds };
  }

  async detectVersion(path: string): Promise<string | null> {
    const content = await readFile(path, "utf-8");
    const firstLine = content.split("\n")[0];
    if (!firstLine) return null;

    try {
      const entry = JSON.parse(firstLine) as RawLogEntry;
      return entry.version ?? null;
    } catch {
      return null;
    }
  }

  private resolveRole(
    entry: RawLogEntry
  ): Message["role"] | null {
    if (entry.type === "user") return "user";
    if (entry.type === "assistant") return "assistant";
    if (entry.type === "system") return "system";
    if (entry.type === "result") return "result";
    if (entry.message?.role === "user") return "user";
    if (entry.message?.role === "assistant") return "assistant";
    return null;
  }

  private extractContent(entry: RawLogEntry): string {
    const content = entry.message?.content;
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content
        .map((block: any) => {
          if (typeof block === "string") return block;
          if (block?.type === "text") return block.text ?? "";
          if (block?.type === "tool_use")
            return `[Tool: ${block.name}]`;
          if (block?.type === "tool_result")
            return block.content ?? "";
          return "";
        })
        .filter(Boolean)
        .join("\n");
    }
    return "";
  }

  private extractToolUses(entry: RawLogEntry): ToolUse[] {
    const tools: ToolUse[] = [];

    if (entry.toolUse) {
      tools.push({
        name: entry.toolUse.name ?? "unknown",
        input: entry.toolUse.input ?? {},
        output: entry.toolUseResult?.content,
      });
    }

    // Also extract from message content blocks
    const content = entry.message?.content;
    if (Array.isArray(content)) {
      for (const block of content) {
        if (block?.type === "tool_use") {
          tools.push({
            name: block.name ?? "unknown",
            input: block.input ?? {},
          });
        }
      }
    }

    return tools;
  }
}
