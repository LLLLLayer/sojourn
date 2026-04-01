export type DistillMode = "thought_tree" | "sop" | "workflow" | "auto";

export interface AnalysisResult {
  type: DistillMode;
  sessionIds: string[];
  createdAt: Date;
}

// ── Thought Tree (aligned with docs/internal/thought-tree-spec.md) ──

export type NodeType =
  | "question"
  | "hypothesis"
  | "investigation"
  | "evidence"
  | "pruning"
  | "convergence"
  | "subproblem"
  | "implementation";

export type EdgeType =
  | "supports"
  | "contradicts"
  | "responds_to"
  | "decomposes"
  | "supersedes";

export interface TreeNode {
  id: string;
  parentId: string | null;
  nodeType: NodeType;
  label: string;
  reason?: string;
  messageIds: string[];
  edgeType?: EdgeType;
  confidence?: number;
}

export interface ThoughtTreeResult extends AnalysisResult {
  type: "thought_tree";
  rootQuestion: string;
  nodes: TreeNode[];
  summary?: string;
}

// ── SOP ──

export interface Step {
  description: string;
  failureBranch?: string;
  precondition?: string;
}

export interface SOPResult extends AnalysisResult {
  type: "sop";
  title: string;
  steps: Step[];
  summary?: string;
}

// ── Workflow Pattern ──

export interface WorkflowResult extends AnalysisResult {
  type: "workflow";
  patternName: string;
  trigger: string;
  recommendation: string;
  evidence: string[];
}
