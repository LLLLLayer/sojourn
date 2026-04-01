import type { AnalysisResult } from "@sojourn/shared";

export interface BaseSink {
  readonly name: string;
  write(result: AnalysisResult): Promise<void>;
  testConnection(): Promise<boolean>;
}
