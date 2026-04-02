import type { MessageTree, DistillMode } from "@sojourn/shared";
import { getMainChain } from "@sojourn/shared";
import { renderPrompt } from "../prompts/loader.js";
import { loadConfig } from "../config.js";

export const LANG_INSTRUCTIONS: Record<string, string> = {
  zh: "IMPORTANT: Output ALL text content (titles, labels, descriptions, reasons, steps) in Chinese (中文). JSON keys remain in English.",
  en: "Output all text content in English.",
};

export function formatConversation(tree: MessageTree): string {
  const chain = getMainChain(tree);
  return chain
    .map((msg) => {
      const role = msg.role.toUpperCase();
      const tools =
        msg.toolUses.length > 0
          ? `\n[Tools: ${msg.toolUses.map((t) => `${t.name}${t.output ? ` → ${t.output.slice(0, 200)}` : ""}`).join(", ")}]`
          : "";
      return `[${role}] (${msg.id})\n${msg.content}${tools}`;
    })
    .join("\n\n---\n\n");
}

export function getPromptName(mode: Exclude<DistillMode, "auto">): string {
  const map: Record<string, string> = {
    thought_tree: "thought-tree",
    sop: "sop",
    workflow: "workflow",
  };
  return map[mode] ?? mode;
}

export function parseJSON(text: string): Record<string, unknown> {
  // Strategy 1: extract from markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1].trim()); } catch { /* try next */ }
  }

  // Strategy 2: find first { ... } block
  const braceStart = text.indexOf("{");
  const braceEnd = text.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd > braceStart) {
    try { return JSON.parse(text.slice(braceStart, braceEnd + 1)); } catch { /* try next */ }
  }

  // Strategy 3: whole text
  try { return JSON.parse(text.trim()); }
  catch { throw new Error(`Failed to parse response as JSON:\n${text.slice(0, 500)}`); }
}

export async function getLangInstruction(): Promise<string> {
  const config = await loadConfig();
  return LANG_INSTRUCTIONS[config.language] ?? LANG_INSTRUCTIONS.en;
}

export async function buildPrompt(
  mode: Exclude<DistillMode, "auto">,
  conversation: string
): Promise<string> {
  const langInstruction = await getLangInstruction();
  return renderPrompt(getPromptName(mode), { conversation, language: langInstruction });
}
