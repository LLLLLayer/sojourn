import type { MessageTree, DistillMode } from "@sojourn/shared";
import { isLinear, getBranches } from "@sojourn/shared";

/**
 * Classify a single conversation into a distill mode.
 * Rules first, LLM fallback later.
 */
export function classify(tree: MessageTree): Exclude<DistillMode, "auto"> {
  // If the conversation has branches, it's likely a thought tree
  if (!isLinear(tree)) {
    return "thought_tree";
  }

  // Linear conversations → SOP
  return "sop";
}

/**
 * Multi-session always → workflow pattern analysis.
 */
export function classifyMulti(
  _trees: MessageTree[]
): Exclude<DistillMode, "auto"> {
  return "workflow";
}
