import { describe, it, expect } from "vitest";
import { join } from "path";
import { ClaudeCodeParser } from "../packages/core/src/parser/claude.js";
import { classify } from "../packages/core/src/distiller/classifier.js";

const FIXTURES = join(import.meta.dirname, "fixtures");
const parser = new ClaudeCodeParser();

describe("Classifier", () => {
  it("classifies linear conversation as SOP", async () => {
    const tree = await parser.parse(join(FIXTURES, "simple-linear.jsonl"));
    expect(classify(tree)).toBe("sop");
  });

  it("classifies branching conversation as thought_tree", async () => {
    const tree = await parser.parse(join(FIXTURES, "branching.jsonl"));
    expect(classify(tree)).toBe("thought_tree");
  });
});
