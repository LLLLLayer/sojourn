import type { AnalysisResult, DistillMode } from "./result.js";

export type PendingStatus = "processing" | "pending" | "editing" | "committed" | "discarded" | "error";

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
