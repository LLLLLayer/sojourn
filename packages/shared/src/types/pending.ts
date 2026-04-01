import type { AnalysisResult, DistillMode } from "./result.js";

export type PendingStatus = "pending" | "editing" | "committed" | "discarded";

export interface PendingResult {
  id: string;
  sessionIds: string[];
  resultType: DistillMode;
  resultData: AnalysisResult;
  status: PendingStatus;
  createdAt: string;
  updatedAt: string;
  committedTo: string | null;
}
