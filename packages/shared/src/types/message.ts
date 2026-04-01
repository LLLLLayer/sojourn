export interface ToolUse {
  name: string;
  input: Record<string, unknown>;
  output?: string;
}

export interface Message {
  id: string;
  parentId: string | null;
  role: "user" | "assistant" | "system" | "result";
  content: string;
  toolUses: ToolUse[];
  isSidechain: boolean;
  timestamp: Date;
}

export interface MessageTree {
  sessionId: string;
  messages: Map<string, Message>;
  rootIds: string[];
}

export function isLinear(tree: MessageTree): boolean {
  for (const msg of tree.messages.values()) {
    if (msg.isSidechain) return false;
  }
  const childCount = new Map<string, number>();
  for (const msg of tree.messages.values()) {
    if (msg.parentId) {
      childCount.set(msg.parentId, (childCount.get(msg.parentId) ?? 0) + 1);
    }
  }
  for (const count of childCount.values()) {
    if (count > 1) return false;
  }
  return true;
}

export function getMainChain(tree: MessageTree): Message[] {
  const messages = [...tree.messages.values()]
    .filter((m) => !m.isSidechain)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  return messages;
}

export function getBranches(tree: MessageTree): Message[][] {
  const sidechains = [...tree.messages.values()].filter((m) => m.isSidechain);
  if (sidechains.length === 0) return [];

  const branchMap = new Map<string, Message[]>();
  for (const msg of sidechains) {
    const key = msg.parentId ?? "orphan";
    if (!branchMap.has(key)) branchMap.set(key, []);
    branchMap.get(key)!.push(msg);
  }
  return [...branchMap.values()];
}
