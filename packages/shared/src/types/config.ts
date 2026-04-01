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

export interface SojournConfig {
  defaultAnalyzer: string;
  defaultSinks: string[];
  analyzers: Record<string, AnalyzerConfig>;
  sinks: Record<string, Record<string, unknown>>;
  git: GitSinkConfig;
  agents: Record<string, { logPath: string }>;
}
