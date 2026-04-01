import type { MessageTree } from "@sojourn/shared";
import type { AnalysisResult, DistillMode } from "@sojourn/shared";

export interface BaseAnalyzer {
  analyze(
    tree: MessageTree,
    mode: Exclude<DistillMode, "auto">
  ): Promise<AnalysisResult>;

  analyzeMulti(
    trees: MessageTree[],
    mode: Exclude<DistillMode, "auto">
  ): Promise<AnalysisResult>;
}
