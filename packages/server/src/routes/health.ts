import { Hono } from "hono";
import { execFile } from "child_process";
import { promisify } from "util";
import { isHookInstalled, loadConfig, getConfigPath } from "@sojourn/core";

const execFileAsync = promisify(execFile);
const health = new Hono();

health.get("/", async (c) => {
  let claudeVersion: string | null = null;
  try {
    const { stdout } = await execFileAsync("claude", ["--version"]);
    claudeVersion = stdout.trim();
  } catch {
    // not installed
  }

  const hookInstalled = await isHookInstalled();
  const config = await loadConfig();

  return c.json({
    claudeCode: claudeVersion,
    hookInstalled,
    configPath: getConfigPath(),
    activeRepo: config.git?.activeRepo ?? null,
    repoCount: config.git?.repos?.length ?? 0,
  });
});

export { health };
