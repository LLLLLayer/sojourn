import type { MessageTree, DistillMode } from "@sojourn/shared";
import { isLinear, getBranches, getMainChain } from "@sojourn/shared";
import type { BaseAnalyzer } from "../analyzer/base.js";

/**
 * Classify a single conversation into a distill mode.
 * Rules first, LLM fallback for ambiguous cases.
 */
export function classify(tree: MessageTree): Exclude<DistillMode, "auto"> {
  // Clear structural signals → use rules
  if (!isLinear(tree)) {
    const branches = getBranches(tree);
    if (branches.length >= 2) {
      return "thought_tree";
    }
  }

  const chain = getMainChain(tree);

  // Very short conversations are always SOP
  if (chain.length <= 4) {
    return "sop";
  }

  // Check for decision-making signals in content
  const content = chain.map((m) => m.content).join(" ").toLowerCase();
  const decisionSignals = [
    "方案",
    "option",
    "approach",
    "alternative",
    "instead",
    "rather than",
    "trade-off",
    "tradeoff",
    "pros and cons",
    "比较",
    "选择",
    "放弃",
    "不用",
    "换一个",
    "try another",
    "didn't work",
    "won't work",
  ];

  const signalCount = decisionSignals.filter((s) =>
    content.includes(s)
  ).length;

  if (signalCount >= 3) {
    return "thought_tree";
  }

  // Default: SOP for linear conversations
  return "sop";
}

/**
 * Classify with LLM fallback for truly ambiguous cases.
 * Currently falls back to rule-based classification.
 */
export async function classifyWithLLM(
  tree: MessageTree,
  _analyzer: BaseAnalyzer
): Promise<Exclude<DistillMode, "auto">> {
  // TODO: implement LLM-based classification using classifier prompt
  return classify(tree);
}

/**
 * Multi-session always → workflow pattern analysis.
 */
export function classifyMulti(
  _trees: MessageTree[]
): Exclude<DistillMode, "auto"> {
  return "workflow";
}
