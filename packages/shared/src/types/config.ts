export interface AnalyzerConfig {
  apiKey?: string;
  model?: string;
  endpoint?: string;
}

export interface GitRepoConfig {
  name: string;
  url: string;
}

export interface GitSinkConfig {
  repos: GitRepoConfig[];
  activeRepo: string | null;
}

export type Language = "zh" | "en";

export interface SojournConfig {
  language: Language;
  defaultAnalyzer: string;
  defaultSinks: string[];
  analyzers: Record<string, AnalyzerConfig>;
  sinks: Record<string, Record<string, unknown>>;
  git: GitSinkConfig;
  agents: Record<string, { logPath: string }>;
}
