import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, mkdir, access } from "fs/promises";
import { join } from "path";
import { homedir } from "os";
import { randomUUID } from "crypto";
import type { AnalysisResult } from "@sojourn/shared";
import type { BaseSink } from "./base.js";

const execFileAsync = promisify(execFile);

const REPOS_DIR = join(homedir(), ".sojourn", "repos");

interface GitRepoSinkOptions {
  repoUrl: string;
  repoName: string;
  localPath?: string;
}

export class GitRepoSink implements BaseSink {
  readonly name = "git-repo";
  private repoUrl: string;
  private repoName: string;
  private localPath: string;

  constructor(options: GitRepoSinkOptions) {
    this.repoUrl = options.repoUrl;
    this.repoName = options.repoName;
    this.localPath = options.localPath ?? join(REPOS_DIR, this.repoName);
  }

  async write(result: AnalysisResult): Promise<void> {
    await this.ensureCloned();
    await this.pullLatest();

    const branchName = `sojourn/${this.generateBranchName(result)}`;
    await this.createBranch(branchName);

    const { filePath, content } = this.formatOutput(result);
    const fullPath = join(this.localPath, filePath);
    await mkdir(join(this.localPath, this.getSubDir(result)), { recursive: true });
    await writeFile(fullPath, content, "utf-8");

    await this.git("add", filePath);
    await this.git("commit", "-m", this.generateCommitMessage(result));
    await this.git("push", "-u", "origin", branchName);

    // Try to create PR via gh CLI
    try {
      await this.createPR(branchName, result);
    } catch {
      console.error(
        `Branch pushed. Create PR manually: ${this.repoUrl}/compare/${branchName}`
      );
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.ensureCloned();
      return true;
    } catch {
      return false;
    }
  }

  private async ensureCloned(): Promise<void> {
    try {
      await access(join(this.localPath, ".git"));
    } catch {
      await mkdir(REPOS_DIR, { recursive: true });
      await execFileAsync("git", ["clone", this.repoUrl, this.localPath]);
    }
  }

  private async pullLatest(): Promise<void> {
    try {
      await this.git("checkout", "main");
      await this.git("pull", "--rebase");
    } catch {
      // Try master if main doesn't exist
      try {
        await this.git("checkout", "master");
        await this.git("pull", "--rebase");
      } catch {
        // Fresh repo, no branches yet
      }
    }
  }

  private async createBranch(name: string): Promise<void> {
    await this.git("checkout", "-b", name);
  }

  private async git(...args: string[]): Promise<string> {
    const { stdout } = await execFileAsync("git", args, {
      cwd: this.localPath,
    });
    return stdout.trim();
  }

  private async createPR(
    branchName: string,
    result: AnalysisResult
  ): Promise<void> {
    const title = this.generatePRTitle(result);
    const body = this.generatePRBody(result);

    await execFileAsync(
      "gh",
      [
        "pr",
        "create",
        "--title",
        title,
        "--body",
        body,
        "--head",
        branchName,
      ],
      { cwd: this.localPath }
    );

    console.log(`PR created: ${title}`);
  }

  private getSubDir(result: AnalysisResult): string {
    const typeDir =
      result.type === "thought_tree"
        ? "thought-trees"
        : result.type === "sop"
          ? "sops"
          : "workflows";
    return typeDir;
  }

  private formatOutput(result: AnalysisResult): {
    filePath: string;
    content: string;
  } {
    const date = new Date().toISOString().slice(0, 10);
    const slug = this.generateSlug(result);
    const typeDir = this.getSubDir(result);
    const filePath = `${typeDir}/${date}-${slug}.md`;

    const content = this.formatMarkdown(result);
    return { filePath, content };
  }

  private formatMarkdown(result: AnalysisResult): string {
    const lines: string[] = [];
    const date = new Date().toISOString().slice(0, 10);

    // Frontmatter
    lines.push("---");
    lines.push(`type: ${result.type}`);
    lines.push(`date: ${date}`);
    lines.push(`sessions: [${result.sessionIds.join(", ")}]`);
    lines.push(`source: sojourn`);
    lines.push("---\n");

    if (result.type === "sop") {
      const sop = result as any;
      lines.push(`# ${sop.title}\n`);
      if (sop.summary) lines.push(`> ${sop.summary}\n`);

      for (let i = 0; i < sop.steps.length; i++) {
        const step = sop.steps[i];
        lines.push(`${i + 1}. ${step.description}`);
        if (step.precondition) {
          lines.push(`   - **前置条件**: ${step.precondition}`);
        }
        if (step.failureBranch) {
          lines.push(`   - **失败处理**: ${step.failureBranch}`);
        }
      }
    } else if (result.type === "thought_tree") {
      const tree = result as any;
      lines.push(`# ${tree.rootQuestion}\n`);
      if (tree.summary) lines.push(`> ${tree.summary}\n`);

      // Key decisions
      const convergences = tree.nodes.filter(
        (n: any) => n.nodeType === "convergence" && n.reason
      );
      const prunings = tree.nodes.filter(
        (n: any) => n.nodeType === "pruning" && n.reason
      );

      if (convergences.length) {
        lines.push("## 决策\n");
        for (const n of convergences) {
          lines.push(`- ✅ **${n.label}**: ${n.reason}`);
        }
        lines.push("");
      }
      if (prunings.length) {
        lines.push("## 放弃的方案\n");
        for (const n of prunings) {
          lines.push(`- ❌ **${n.label}**: ${n.reason}`);
        }
        lines.push("");
      }

      // Full tree
      lines.push("## 完整决策树\n");
      lines.push("```");
      const childMap = new Map<string | null, any[]>();
      for (const node of tree.nodes) {
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
    } else {
      const wf = result as any;
      lines.push(`# ${wf.patternName}\n`);
      lines.push(`**触发条件**: ${wf.trigger}\n`);
      lines.push(`**推荐做法**: ${wf.recommendation}\n`);
      if (wf.evidence?.length) {
        lines.push("## 证据\n");
        for (const e of wf.evidence) {
          lines.push(`- ${e}`);
        }
      }
    }

    return lines.join("\n") + "\n";
  }

  private generateSlug(result: AnalysisResult): string {
    if (result.type === "sop") {
      return slugify((result as any).title ?? "sop");
    }
    if (result.type === "thought_tree") {
      return slugify((result as any).rootQuestion ?? "thought-tree");
    }
    return slugify((result as any).patternName ?? "workflow");
  }

  private generateBranchName(result: AnalysisResult): string {
    const slug = this.generateSlug(result);
    const id = randomUUID().slice(0, 6);
    return `${slug}-${id}`;
  }

  private generateCommitMessage(result: AnalysisResult): string {
    if (result.type === "sop") {
      return `Add SOP: ${(result as any).title}`;
    }
    if (result.type === "thought_tree") {
      return `Add thought tree: ${(result as any).rootQuestion}`;
    }
    return `Add workflow pattern: ${(result as any).patternName}`;
  }

  private generatePRTitle(result: AnalysisResult): string {
    return this.generateCommitMessage(result);
  }

  private generatePRBody(result: AnalysisResult): string {
    const lines = [
      "## Summary\n",
      `- Type: ${result.type}`,
      `- Sessions: ${result.sessionIds.join(", ")}`,
      `- Generated by [Sojourn](https://github.com/LLLLLayer/sojourn)\n`,
      "## Review Checklist\n",
      "- [ ] Content is accurate and reusable",
      "- [ ] No sensitive information (API keys, internal URLs, etc.)",
      "- [ ] Applicable to the team (not just the original author)",
    ];
    return lines.join("\n");
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}
