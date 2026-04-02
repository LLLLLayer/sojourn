import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { homedir } from "os";
import { parserRegistry, analyzerRegistry } from "./index.js";
import { classify } from "./distiller/classifier.js";
import { savePending } from "./store.js";

const CLAUDE_SETTINGS_PATH = join(homedir(), ".claude", "settings.json");

const HOOK_COMMAND = "npx sojourn auto-analyze --session $SESSION_ID";

interface ClaudeSettings {
  hooks?: Record<string, Array<{ type: string; command: string }>>;
  [key: string]: unknown;
}

/**
 * Install the post-session hook into Claude Code settings.json
 */
export async function installHook(): Promise<void> {
  const settings = await loadSettings();

  if (!settings.hooks) {
    settings.hooks = {};
  }

  if (!settings.hooks.PostToolUse) {
    // PostSessionEnd is not yet a real hook event in Claude Code.
    // Use a general-purpose approach: install as a notification hook.
    // For now, we document that users should run `sojourn auto-analyze` manually
    // or via a shell alias after each session.
  }

  // Add to StopSession hook if available, otherwise create a general hook
  const hookEvent = "Stop";
  if (!settings.hooks[hookEvent]) {
    settings.hooks[hookEvent] = [];
  }

  const existing = settings.hooks[hookEvent].find(
    (h) => h.command.includes("sojourn")
  );

  if (existing) {
    console.log("Sojourn hook already installed.");
    return;
  }

  settings.hooks[hookEvent].push({
    type: "command",
    command: HOOK_COMMAND,
  });

  await saveSettings(settings);
  console.log(`Hook installed in ${CLAUDE_SETTINGS_PATH}`);
  console.log(`Event: ${hookEvent}`);
  console.log(`Command: ${HOOK_COMMAND}`);
}

/**
 * Remove the sojourn hook from Claude Code settings.json
 */
export async function uninstallHook(): Promise<void> {
  const settings = await loadSettings();

  if (!settings.hooks) {
    console.log("No hooks found.");
    return;
  }

  let removed = false;
  for (const [event, hooks] of Object.entries(settings.hooks)) {
    const filtered = hooks.filter(
      (h) => !h.command.includes("sojourn")
    );
    if (filtered.length !== hooks.length) {
      settings.hooks[event] = filtered;
      if (filtered.length === 0) {
        delete settings.hooks[event];
      }
      removed = true;
    }
  }

  if (removed) {
    await saveSettings(settings);
    console.log("Sojourn hook removed.");
  } else {
    console.log("No sojourn hook found.");
  }
}

/**
 * Check if the sojourn hook is installed
 */
export async function isHookInstalled(): Promise<boolean> {
  const settings = await loadSettings();
  if (!settings.hooks) return false;

  for (const hooks of Object.values(settings.hooks)) {
    if (hooks.some((h) => h.command.includes("sojourn"))) {
      return true;
    }
  }
  return false;
}

/**
 * Auto-analyze a session (called by the hook)
 */
export async function autoAnalyze(sessionId: string): Promise<void> {
  // Find the session file
  const claudeProjectsDir = join(homedir(), ".claude", "projects");
  const sessionPath = await findSessionFile(claudeProjectsDir, sessionId);

  if (!sessionPath) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  const parser = parserRegistry.get("claude-code");
  const tree = await parser.parse(sessionPath);

  const mode = classify(tree);
  const analyzer = analyzerRegistry.get("claude-code");
  const result = await analyzer.analyze(tree, mode);

  const id = await savePending([tree.sessionId], result);
  console.log(`Auto-analyzed session ${sessionId} → pending ${id} (${mode})`);
}

async function findSessionFile(
  projectsDir: string,
  sessionId: string
): Promise<string | null> {
  const { readdir } = await import("fs/promises");

  try {
    const projects = await readdir(projectsDir);
    for (const project of projects) {
      const projectDir = join(projectsDir, project);
      const files = await readdir(projectDir).catch(() => []);
      const match = files.find((f) => f.includes(sessionId));
      if (match) {
        return join(projectDir, match);
      }
    }
  } catch {
    // projects dir doesn't exist
  }
  return null;
}

async function loadSettings(): Promise<ClaudeSettings> {
  try {
    const content = await readFile(CLAUDE_SETTINGS_PATH, "utf-8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function saveSettings(settings: ClaudeSettings): Promise<void> {
  await writeFile(
    CLAUDE_SETTINGS_PATH,
    JSON.stringify(settings, null, 2),
    "utf-8"
  );
}
