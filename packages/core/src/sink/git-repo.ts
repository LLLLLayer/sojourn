import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, mkdir, access } from "fs/promises";
import { join } from "path";
import { homedir } from "os";
import { randomUUID } from "crypto";
import type { AnalysisResult } from "@sojourn/shared";
import type { BaseSink } from "./base.js";
import { formatAsMarkdown } from "../formatter.js";

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
    const date = new Date().toISOString().slice(0, 10);
    const frontmatter = [
      "---",
      `type: ${result.type}`,
      `date: ${date}`,
      `sessions: [${result.sessionIds.join(", ")}]`,
      `source: sojourn`,
      "---\n",
    ].join("\n");
    return frontmatter + formatAsMarkdown(result);
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
