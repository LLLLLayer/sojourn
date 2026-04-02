import { describe, it, expect } from "vitest";
import { join } from "path";
import { detectFormat } from "../packages/core/src/parser/detect.js";

const FIXTURES = join(import.meta.dirname, "fixtures");

describe("detectFormat", () => {
  it("detects .jsonl as claude-code", async () => {
    expect(await detectFormat(join(FIXTURES, "simple-linear.jsonl"))).toBe("claude-code");
  });

  it("detects .jsonl extension even without reading content", async () => {
    expect(await detectFormat("/fake/path/session.jsonl")).toBe("claude-code");
  });

  it("detects .db as opencode", async () => {
    expect(await detectFormat("/fake/path/opencode.db")).toBe("opencode");
  });

  it("detects .sqlite as opencode", async () => {
    expect(await detectFormat("/fake/path/data.sqlite")).toBe("opencode");
  });

  it("returns unknown for unrecognized extension", async () => {
    expect(await detectFormat("/fake/path/file.txt")).toBe("unknown");
  });
});
