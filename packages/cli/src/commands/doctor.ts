import { execFile } from "child_process";
import { promisify } from "util";
import { access } from "fs/promises";
import { join } from "path";
import { homedir } from "os";
import { loadConfig, getConfigPath, isHookInstalled } from "@sojourn/core";

const execFileAsync = promisify(execFile);

export async function doctor(): Promise<void> {
  let issues = 0;

  // 1. Check Claude Code CLI
  try {
    const { stdout } = await execFileAsync("claude", ["--version"]);
    console.log(`✅ Claude Code ${stdout.trim()}`);
  } catch {
    console.log("❌ Claude Code CLI not found");
    issues++;
  }

  // 2. Check Claude Code sessions directory
  const config = await loadConfig();
  const logPath = config.agents?.["claude-code"]?.logPath
    ?? join(homedir(), ".claude", "projects");
  try {
    await access(logPath);
    console.log(`✅ Claude Code sessions: ${logPath}`);
  } catch {
    console.log(`❌ Claude Code sessions not found: ${logPath}`);
    issues++;
  }

  // 3. Check hook
  const hookInstalled = await isHookInstalled();
  if (hookInstalled) {
    console.log("✅ Sojourn hook installed");
  } else {
    console.log("⚠️  Sojourn hook not installed (run: sojourn install-hook)");
  }

  // 4. Check config
  try {
    await access(getConfigPath());
    console.log(`✅ Config: ${getConfigPath()}`);
  } catch {
    console.log(`⚠️  No config file (using defaults): ${getConfigPath()}`);
  }

  // 5. Check pending directory
  const pendingDir = join(homedir(), ".sojourn", "pending");
  try {
    await access(pendingDir);
    console.log(`✅ Pending store: ${pendingDir}`);
  } catch {
    console.log(`⚠️  Pending store not created yet: ${pendingDir}`);
  }

  console.log(
    issues === 0
      ? "\nAll good!"
      : `\n${issues} issue(s) found.`
  );
}
