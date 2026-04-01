import { writeFile, mkdir } from "fs/promises";
import { dirname } from "path";
import type { AnalysisResult } from "@sojourn/shared";
import type { BaseSink } from "./base.js";

export class FileSink implements BaseSink {
  readonly name = "file";
  private outputPath: string;
  private format: "json" | "markdown";

  constructor(outputPath: string, format: "json" | "markdown" = "json") {
    this.outputPath = outputPath;
    this.format = format;
  }

  async write(result: AnalysisResult): Promise<void> {
    await mkdir(dirname(this.outputPath), { recursive: true });

    const content =
      this.format === "json"
        ? JSON.stringify(result, null, 2)
        : formatAsMarkdown(result);

    await writeFile(this.outputPath, content, "utf-8");
  }

  async testConnection(): Promise<boolean> {
    return true;
  }
}

function formatAsMarkdown(result: AnalysisResult): string {
  if (result.type === "sop") {
    return formatSOP(result as any);
  }
  if (result.type === "thought_tree") {
    return formatThoughtTree(result as any);
  }
  return JSON.stringify(result, null, 2);
}

function formatSOP(result: {
  title: string;
  summary?: string;
  steps: { description: string; failureBranch?: string; precondition?: string }[];
}): string {
  const lines: string[] = [];
  lines.push(`# ${result.title}\n`);
  if (result.summary) lines.push(`> ${result.summary}\n`);

  for (let i = 0; i < result.steps.length; i++) {
    const step = result.steps[i];
    lines.push(`${i + 1}. ${step.description}`);
    if (step.precondition) {
      lines.push(`   - **前置条件**: ${step.precondition}`);
    }
    if (step.failureBranch) {
      lines.push(`   - **失败处理**: ${step.failureBranch}`);
    }
  }

  return lines.join("\n") + "\n";
}

function formatThoughtTree(result: {
  rootQuestion: string;
  summary?: string;
  nodes: {
    id: string;
    parentId: string | null;
    nodeType: string;
    label: string;
    reason?: string;
  }[];
}): string {
  const lines: string[] = [];
  lines.push(`# ${result.rootQuestion}\n`);
  if (result.summary) lines.push(`> ${result.summary}\n`);

  const childMap = new Map<string | null, typeof result.nodes>();
  for (const node of result.nodes) {
    const key = node.parentId;
    if (!childMap.has(key)) childMap.set(key, []);
    childMap.get(key)!.push(node);
  }

  function printNode(nodeId: string | null, indent: string): void {
    const children = childMap.get(nodeId) ?? [];
    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      const isLast = i === children.length - 1;
      const prefix = indent + (isLast ? "└─ " : "├─ ");
      const childIndent = indent + (isLast ? "   " : "│  ");

      lines.push(`${prefix}**[${node.nodeType}]** ${node.label}`);
      if (node.reason) {
        lines.push(`${childIndent}  _reason: ${node.reason}_`);
      }
      printNode(node.id, childIndent);
    }
  }

  printNode(null, "");
  return lines.join("\n") + "\n";
}
