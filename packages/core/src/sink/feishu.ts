import type { AnalysisResult } from "@sojourn/shared";
import type { BaseSink } from "./base.js";
import { formatAsMarkdown } from "../formatter.js";
import { loadConfig } from "../config.js";

/**
 * Writes distilled knowledge to a Feishu (Lark) Wiki document.
 *
 * Requires feishu API access. Can work in two modes:
 * 1. MCP mode: Assumes feishu-docs MCP server is available (used by Claude Code)
 * 2. API mode: Direct HTTP calls to Feishu Open API (requires app_id + app_secret in config)
 *
 * For now, this sink creates a local markdown file that can be manually
 * uploaded to Feishu, or used with the feishu-docs MCP tool.
 */
export class FeishuSink implements BaseSink {
  readonly name = "feishu";

  async write(result: AnalysisResult): Promise<void> {
    const config = await loadConfig();
    const spaceId = (config.sinks?.feishu as any)?.spaceId;

    if (!spaceId) {
      throw new Error(
        "Feishu spaceId not configured. Run: sojourn config set sinks.feishu.spaceId <your-space-id>"
      );
    }

    const title = this.getTitle(result);
    const content = formatAsMarkdown(result);

    // Try Feishu Open API if credentials are configured
    const appId = (config.sinks?.feishu as any)?.appId;
    const appSecret = (config.sinks?.feishu as any)?.appSecret;

    if (appId && appSecret) {
      await this.createViaAPI(appId, appSecret, spaceId, title, content);
    } else {
      // Fallback: save as local file for manual upload or MCP usage
      const { writeFile, mkdir } = await import("fs/promises");
      const { join } = await import("path");
      const { homedir } = await import("os");
      const outDir = join(homedir(), ".sojourn", "feishu-export");
      await mkdir(outDir, { recursive: true });
      const slug = title.replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "-").slice(0, 50);
      const date = new Date().toISOString().slice(0, 10);
      const path = join(outDir, `${date}-${slug}.md`);
      await writeFile(path, content, "utf-8");
      console.log(`Feishu export saved to ${path} (configure appId/appSecret for direct upload)`);
    }
  }

  async testConnection(): Promise<boolean> {
    const config = await loadConfig();
    return !!(config.sinks?.feishu as any)?.spaceId;
  }

  private async createViaAPI(
    appId: string,
    appSecret: string,
    spaceId: string,
    title: string,
    _content: string
  ): Promise<void> {
    // Get tenant access token
    const tokenRes = await fetch(
      "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
      }
    );
    const tokenData = await tokenRes.json() as any;
    if (tokenData.code !== 0) {
      throw new Error(`Feishu auth failed: ${tokenData.msg}`);
    }
    const token = tokenData.tenant_access_token;

    // Create wiki node
    const createRes = await fetch(
      `https://open.feishu.cn/open-apis/wiki/v2/spaces/${spaceId}/nodes`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          obj_type: "doc",
          title,
        }),
      }
    );
    const createData = await createRes.json() as any;
    if (createData.code !== 0) {
      throw new Error(`Feishu create node failed: ${createData.msg}`);
    }

    console.log(`Feishu wiki node created: ${title}`);
  }

  private getTitle(result: AnalysisResult): string {
    const rd = result as any;
    const prefix = result.type === "sop" ? "SOP" : result.type === "thought_tree" ? "Decision" : "Workflow";
    const name = rd.title ?? rd.rootQuestion ?? rd.patternName ?? "Untitled";
    return `[Sojourn] ${prefix}: ${name}`;
  }
}
