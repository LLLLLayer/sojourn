import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function renderPrompt(
  name: string,
  context: Record<string, string>
): Promise<string> {
  const template = await readFile(
    join(__dirname, `${name}.md`),
    "utf-8"
  );
  return template.replace(
    /\{\{(\w+)\}\}/g,
    (_, key) => context[key] ?? ""
  );
}
