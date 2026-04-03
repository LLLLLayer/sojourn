import type { AnalysisResult } from "@sojourn/shared";
import { listPending } from "./store.js";

/**
 * Extract key text from a result for comparison.
 */
function extractText(result: AnalysisResult): string {
  const parts: string[] = [];

  if (result.type === "sop") {
    const sop = result as any;
    if (sop.title) parts.push(sop.title);
    for (const step of sop.steps ?? []) {
      if (step.description) parts.push(step.description);
    }
  } else if (result.type === "thought_tree") {
    const tree = result as any;
    if (tree.rootQuestion) parts.push(tree.rootQuestion);
    for (const node of tree.nodes ?? []) {
      if (node.label) parts.push(node.label);
      if (node.reason) parts.push(node.reason);
    }
  } else if (result.type === "workflow") {
    const wf = result as any;
    if (wf.patternName) parts.push(wf.patternName);
    if (wf.trigger) parts.push(wf.trigger);
    if (wf.recommendation) parts.push(wf.recommendation);
  }

  return parts.join(" ").toLowerCase();
}

/**
 * Simple word-overlap similarity (Jaccard-like).
 */
function similarity(a: string, b: string): number {
  const wordsA = new Set(a.split(/\s+/).filter((w) => w.length > 2));
  const wordsB = new Set(b.split(/\s+/).filter((w) => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }
  const union = wordsA.size + wordsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export interface DedupMatch {
  id: string;
  similarity: number;
  title: string;
}

/**
 * Check if a new result is similar to any existing pending/committed results.
 * Returns matches above the threshold (default 0.5 = 50% word overlap).
 */
export async function findDuplicates(
  result: AnalysisResult,
  threshold = 0.5
): Promise<DedupMatch[]> {
  const newText = extractText(result);
  if (!newText) return [];

  const existing = await listPending();
  const matches: DedupMatch[] = [];

  for (const item of existing) {
    if (item.status === "discarded") continue;

    const existingText = extractText(item.resultData);
    const sim = similarity(newText, existingText);

    if (sim >= threshold) {
      const rd = item.resultData as any;
      const title = rd?.title ?? rd?.rootQuestion ?? rd?.patternName ?? item.id;
      matches.push({ id: item.id, similarity: sim, title });
    }
  }

  return matches.sort((a, b) => b.similarity - a.similarity);
}
