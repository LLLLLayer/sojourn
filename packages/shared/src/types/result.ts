export type DistillMode = "thought_tree" | "sop" | "workflow" | "auto";

// Base fields shared by all result types
interface ResultBase {
  sessionIds: string[];
  createdAt: string; // ISO 8601 string (not Date — consistent across serialize/deserialize)
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

export interface ThoughtTreeResult extends ResultBase {
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

export interface SOPResult extends ResultBase {
  type: "sop";
  title: string;
  steps: Step[];
  summary?: string;
}

// ── Workflow Pattern ──

export interface WorkflowResult extends ResultBase {
  type: "workflow";
  patternName: string;
  trigger: string;
  recommendation: string;
  evidence: string[];
}

// ── Discriminated Union ──

export type DistillResult = ThoughtTreeResult | SOPResult | WorkflowResult;

// Backward compat alias
export type AnalysisResult = DistillResult;
