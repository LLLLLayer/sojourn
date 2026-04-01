import { readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { homedir } from "os";
import type { SojournConfig } from "@sojourn/shared";

const CONFIG_PATH = join(homedir(), ".sojourn", "config.json");

const DEFAULT_CONFIG: SojournConfig = {
  defaultAnalyzer: "claude-code",
  defaultSinks: ["claude-md"],
  analyzers: {
    "claude-code": {},
    "claude-api": {},
  },
  sinks: {
    "claude-md": { path: "auto" },
  },
  agents: {
    "claude-code": { logPath: join(homedir(), ".claude", "projects") },
  },
};

export async function loadConfig(): Promise<SojournConfig> {
  try {
    const content = await readFile(CONFIG_PATH, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function saveConfig(config: SojournConfig): Promise<void> {
  await mkdir(dirname(CONFIG_PATH), { recursive: true });
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

export async function getConfigValue(key: string): Promise<unknown> {
  const config = await loadConfig();
  return getNestedValue(config, key);
}

export async function setConfigValue(
  key: string,
  value: string
): Promise<void> {
  const config = await loadConfig();
  setNestedValue(config, key, tryParseValue(value));
  await saveConfig(config);
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}

function getNestedValue(obj: any, path: string): unknown {
  const keys = path.split(".");
  let current = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return undefined;
    current = current[key];
  }
  return current;
}

function setNestedValue(obj: any, path: string, value: unknown): void {
  const keys = path.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (current[keys[i]] == null || typeof current[keys[i]] !== "object") {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

function tryParseValue(value: string): unknown {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== "") return num;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
