import type { MessageTree } from "@sojourn/shared";

export interface BaseParser {
  readonly agent: string;
  readonly supportedVersions: string;
  parse(path: string): Promise<MessageTree>;
  detectVersion(path: string): Promise<string | null>;
}
