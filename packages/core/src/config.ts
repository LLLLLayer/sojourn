import { readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { homedir } from "os";
import type { SojournConfig } from "@sojourn/shared";

const CONFIG_PATH = join(homedir(), ".sojourn", "config.json");

const DEFAULT_CONFIG: SojournConfig = {
  language: "zh",
  fontSize: 16,
  defaultAnalyzer: "claude-code",
  sessionAliases: {},
  defaultSinks: ["claude-md"],
  analyzers: {
    "claude-code": {},
    "claude-api": {},
  },
  sinks: {
    "claude-md": { path: "auto" },
  },
  git: {
    repos: [],
    activeRepo: null,
  },
  agents: {
    "claude-code": { logPath: join(homedir(), ".claude", "projects") },
  },
};

export async function loadConfig(): Promise<SojournConfig> {
  try {
    const content = await readFile(CONFIG_PATH, "utf-8");
    return deepMerge(DEFAULT_CONFIG, JSON.parse(content));
  } catch {
    return deepMerge(DEFAULT_CONFIG, {});
  }
}

/** Deep merge: preserves nested defaults when user config only overrides some fields */
function deepMerge<T extends Record<string, any>>(base: T, override: Partial<T>): T {
  const result = { ...base };
  for (const key of Object.keys(override) as (keyof T)[]) {
    const baseVal = base[key];
    const overVal = override[key];
    if (
      baseVal && overVal &&
      typeof baseVal === "object" && !Array.isArray(baseVal) &&
      typeof overVal === "object" && !Array.isArray(overVal)
    ) {
      result[key] = deepMerge(baseVal, overVal as any);
    } else if (overVal !== undefined) {
      result[key] = overVal as T[keyof T];
    }
  }
  return result;
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

export async function bindRepo(name: string, url: string): Promise<void> {
  const config = await loadConfig();
  const existing = config.git.repos.find((r) => r.name === name);
  if (existing) {
    existing.url = url;
  } else {
    config.git.repos.push({ name, url });
  }
  if (!config.git.activeRepo) {
    config.git.activeRepo = name;
  }
  await saveConfig(config);
}

export async function unbindRepo(name: string): Promise<void> {
  const config = await loadConfig();
  config.git.repos = config.git.repos.filter((r) => r.name !== name);
  if (config.git.activeRepo === name) {
    config.git.activeRepo = config.git.repos[0]?.name ?? null;
  }
  await saveConfig(config);
}

export async function switchRepo(name: string): Promise<void> {
  const config = await loadConfig();
  const repo = config.git.repos.find((r) => r.name === name);
  if (!repo) {
    throw new Error(
      `Repo "${name}" not found. Available: ${config.git.repos.map((r) => r.name).join(", ")}`
    );
  }
  config.git.activeRepo = name;
  await saveConfig(config);
}

export async function getActiveRepo(): Promise<{ name: string; url: string } | null> {
  const config = await loadConfig();
  if (!config.git.activeRepo) return null;
  return config.git.repos.find((r) => r.name === config.git.activeRepo) ?? null;
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
