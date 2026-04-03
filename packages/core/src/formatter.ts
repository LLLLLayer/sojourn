import type { AnalysisResult, SOPResult, ThoughtTreeResult, WorkflowResult, TreeNode } from "@sojourn/shared";

/**
 * Format an AnalysisResult as Markdown.
 */
export function formatAsMarkdown(result: AnalysisResult): string {
  switch (result.type) {
    case "sop": return formatSOP(result);
    case "thought_tree": return formatThoughtTree(result);
    case "workflow": return formatWorkflow(result);
  }
}

/**
 * Format as a CLAUDE.md section (compact, for appending).
 */
export function formatAsSection(result: AnalysisResult): string {
  const date = new Date().toISOString().slice(0, 10);

  switch (result.type) {
    case "sop": {
      const steps = result.steps
        .map((s, i) => `${i + 1}. ${s.description}${s.failureBranch ? `\n   - 失败处理: ${s.failureBranch}` : ""}`)
        .join("\n");
      return `### ${result.title}\n_${date} | SOP | session: ${result.sessionIds.join(", ")}_\n\n${steps}\n`;
    }
    case "thought_tree": {
      const prunings = result.nodes
        .filter((n) => n.nodeType === "pruning" && n.reason)
        .map((n) => `- ❌ ${n.label}: ${n.reason}`);
      const convergences = result.nodes
        .filter((n) => n.nodeType === "convergence" && n.reason)
        .map((n) => `- ✅ ${n.label}: ${n.reason}`);
      const lines = [`### ${result.rootQuestion}`];
      lines.push(`_${date} | 思维树 | session: ${result.sessionIds.join(", ")}_\n`);
      if (convergences.length) { lines.push("**决策**:"); lines.push(...convergences); }
      if (prunings.length) { lines.push("\n**放弃的方案**:"); lines.push(...prunings); }
      return lines.join("\n") + "\n";
    }
    case "workflow":
      return `### ${result.patternName}\n_${date} | 工作流 | session: ${result.sessionIds.join(", ")}_\n\n**触发**: ${result.trigger}\n**做法**: ${result.recommendation}\n`;
  }
}

// --- Full Markdown ---

function formatSOP(result: SOPResult): string {
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

function formatThoughtTree(result: ThoughtTreeResult): string {
  const lines: string[] = [];
  lines.push(`# ${result.rootQuestion}\n`);
  if (result.summary) lines.push(`> ${result.summary}\n`);

  const convergences = result.nodes.filter((n) => n.nodeType === "convergence" && n.reason);
  const prunings = result.nodes.filter((n) => n.nodeType === "pruning" && n.reason);

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

  lines.push("## 完整决策树\n");
  lines.push("```");
  const childMap = new Map<string | null, TreeNode[]>();
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
      lines.push(`${prefix}[${node.nodeType}] ${node.label}`);
      printNode(node.id, childIndent);
    }
  }
  printNode(null, "");
  lines.push("```");
  return lines.join("\n") + "\n";
}

function formatWorkflow(result: WorkflowResult): string {
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
