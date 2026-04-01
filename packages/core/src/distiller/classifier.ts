import type { MessageTree, DistillMode } from "@sojourn/shared";
import { isLinear, getBranches, getMainChain } from "@sojourn/shared";
import type { BaseAnalyzer } from "../analyzer/base.js";
import { renderPrompt } from "../prompts/loader.js";

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
 */
export async function classifyWithLLM(
  tree: MessageTree,
  analyzer: BaseAnalyzer
): Promise<Exclude<DistillMode, "auto">> {
  const chain = getMainChain(tree);
  const hasBranches = !isLinear(tree);
  const toolCallCount = chain.reduce(
    (sum, m) => sum + m.toolUses.length,
    0
  );

  // Take first 3 and last 3 messages as preview
  const preview = [
    ...chain.slice(0, 3),
    ...chain.slice(-3),
  ]
    .map((m) => `[${m.role.toUpperCase()}] ${m.content.slice(0, 200)}`)
    .join("\n---\n");

  const prompt = await renderPrompt("classifier", {
    messageCount: String(chain.length),
    hasBranches: String(hasBranches),
    toolCallCount: String(toolCallCount),
    conversationPreview: preview,
  });

  const result = await analyzer.analyze(tree, "sop"); // dummy call to get text
  // The classifier prompt asks for just "thought_tree" or "sop"
  // For now, use the rule-based approach as primary
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
