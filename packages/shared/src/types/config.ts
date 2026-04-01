export interface AnalyzerConfig {
  apiKey?: string;
  model?: string;
  endpoint?: string;
}

export interface GitRepoConfig {
  name: string;
  url: string;
}

export interface SojournConfig {
  defaultAnalyzer: string;
  defaultSinks: string[];
  analyzers: Record<string, AnalyzerConfig>;
  sinks: Record<string, Record<string, unknown>>;
  agents: Record<string, { logPath: string }>;
}
