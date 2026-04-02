import type { AnalysisResult, DistillMode, PendingStatus } from "@sojourn/shared";

// API response types (server-specific shapes)

export interface SessionItem {
  sessionId: string;
  project: string;
  path: string;
  modified: string;
  sizeKB: number;
  alias: string | null;
  firstMessage: string | null;
  lastMessage: string | null;
  messageCount: number;
}

export interface SessionDetail {
  sessionId: string;
  messageCount: number;
  isLinear: boolean;
  branchCount: number;
  messages: MessageItem[];
}

export interface MessageItem {
  id: string;
  role: string;
  content: string;
  toolUses: Array<{ name: string; input: Record<string, unknown>; output?: string }>;
  isSidechain: boolean;
  timestamp: string;
}

export interface PendingItem {
  id: string;
  sessionIds: string[];
  resultType: DistillMode;
  resultData: AnalysisResult;
  status: PendingStatus;
  createdAt: string;
  updatedAt: string;
  committedTo: string | null;
}

export interface AppConfig {
  language: string;
  fontSize: number;
  defaultAnalyzer: string;
  defaultSinks: string[];
  analyzers: Record<string, { apiKey?: string; model?: string; endpoint?: string }>;
  sinks: Record<string, Record<string, unknown>>;
  git: { repos: Array<{ name: string; url: string }>; activeRepo: string | null };
  agents: Record<string, { logPath: string }>;
}
