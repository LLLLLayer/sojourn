import type { AnalysisResult } from "@sojourn/shared";

/**
 * Format an AnalysisResult as Markdown.
 */
export function formatAsMarkdown(result: AnalysisResult): string {
  if (result.type === "sop") return formatSOP(result as any);
  if (result.type === "thought_tree") return formatThoughtTree(result as any);
  if (result.type === "workflow") return formatWorkflow(result as any);
  return JSON.stringify(result, null, 2);
}

/**
 * Format as a CLAUDE.md section (compact, for appending).
 */
export function formatAsSection(result: AnalysisResult): string {
  const date = new Date().toISOString().slice(0, 10);

  if (result.type === "sop") {
    const sop = result as any;
    const steps = sop.steps
      .map(
        (s: any, i: number) =>
          `${i + 1}. ${s.description}${s.failureBranch ? `\n   - 失败处理: ${s.failureBranch}` : ""}`
      )
      .join("\n");
    return `### ${sop.title}\n_${date} | SOP | session: ${result.sessionIds.join(", ")}_\n\n${steps}\n`;
  }

  if (result.type === "thought_tree") {
    const tree = result as any;
    const prunings = (tree.nodes ?? [])
      .filter((n: any) => n.nodeType === "pruning" && n.reason)
      .map((n: any) => `- ❌ ${n.label}: ${n.reason}`);
    const convergences = (tree.nodes ?? [])
      .filter((n: any) => n.nodeType === "convergence" && n.reason)
      .map((n: any) => `- ✅ ${n.label}: ${n.reason}`);

    const lines = [`### ${tree.rootQuestion}`];
    lines.push(`_${date} | 思维树 | session: ${result.sessionIds.join(", ")}_\n`);
    if (convergences.length) { lines.push("**决策**:"); lines.push(...convergences); }
    if (prunings.length) { lines.push("\n**放弃的方案**:"); lines.push(...prunings); }
    return lines.join("\n") + "\n";
  }

  if (result.type === "workflow") {
    const wf = result as any;
    return `### ${wf.patternName}\n_${date} | 工作流 | session: ${result.sessionIds.join(", ")}_\n\n**触发**: ${wf.trigger}\n**做法**: ${wf.recommendation}\n`;
  }

  return `### 知识提炼\n_${date} | ${result.type}_\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\`\n`;
}

// --- Full Markdown ---

function formatSOP(result: any): string {
  const lines: string[] = [];
  lines.push(`# ${result.title}\n`);
  if (result.summary) lines.push(`> ${result.summary}\n`);
  for (let i = 0; i < result.steps.length; i++) {
    const step = result.steps[i];
    lines.push(`${i + 1}. ${step.description}`);
    if (step.precondition) lines.push(`   - **前置条件**: ${step.precondition}`);
    if (step.failureBranch) lines.push(`   - **失败处理**: ${step.failureBranch}`);
  }
  return lines.join("\n") + "\n";
}

function formatThoughtTree(result: any): string {
  const lines: string[] = [];
  lines.push(`# ${result.rootQuestion}\n`);
  if (result.summary) lines.push(`> ${result.summary}\n`);

  // Key decisions
  const convergences = (result.nodes ?? []).filter((n: any) => n.nodeType === "convergence" && n.reason);
  const prunings = (result.nodes ?? []).filter((n: any) => n.nodeType === "pruning" && n.reason);

  if (convergences.length) {
    lines.push("## 决策\n");
    for (const n of convergences) lines.push(`- ✅ **${n.label}**: ${n.reason}`);
    lines.push("");
  }
  if (prunings.length) {
    lines.push("## 放弃的方案\n");
    for (const n of prunings) lines.push(`- ❌ **${n.label}**: ${n.reason}`);
    lines.push("");
  }

  // Full tree
  lines.push("## 完整决策树\n");
  lines.push("```");
  const childMap = new Map<string | null, any[]>();
  for (const node of result.nodes ?? []) {
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
      lines.push(`${prefix}[${node.nodeType}] ${node.label}`);
      printNode(node.id, childIndent);
    }
  }
  printNode(null, "");
  lines.push("```");
  return lines.join("\n") + "\n";
}

function formatWorkflow(result: any): string {
  const lines: string[] = [];
  lines.push(`# ${result.patternName}\n`);
  lines.push(`**触发条件**: ${result.trigger}\n`);
  lines.push(`**推荐做法**: ${result.recommendation}\n`);
  if (result.evidence?.length) {
    lines.push("## 证据\n");
    for (const e of result.evidence) lines.push(`- ${e}`);
  }
  return lines.join("\n") + "\n";
}
