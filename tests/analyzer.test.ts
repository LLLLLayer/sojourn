import { describe, it, expect } from "vitest";
import { parseJSON } from "../packages/core/src/analyzer/common.js";

describe("parseJSON", () => {
  it("parses plain JSON", () => {
    const result = parseJSON('{"title": "test"}');
    expect(result.title).toBe("test");
  });

  it("extracts JSON from markdown code block", () => {
    const result = parseJSON('Some text\n```json\n{"title": "test"}\n```\nMore text');
    expect(result.title).toBe("test");
  });

  it("extracts JSON from code block without lang", () => {
    const result = parseJSON('```\n{"title": "test"}\n```');
    expect(result.title).toBe("test");
  });

  it("extracts JSON by brace detection when code block fails", () => {
    const result = parseJSON('Here is the result: {"title": "test", "steps": []}');
    expect(result.title).toBe("test");
  });

  it("handles nested braces", () => {
    const result = parseJSON('Output: {"a": {"b": "c"}, "d": [1,2]}');
    expect(result.a).toEqual({ b: "c" });
  });

  it("throws on invalid JSON", () => {
    expect(() => parseJSON("not json at all")).toThrow("Failed to parse");
  });

  it("throws on empty string", () => {
    expect(() => parseJSON("")).toThrow("Failed to parse");
  });

  it("handles Chinese content in JSON", () => {
    const result = parseJSON('{"title": "配置 SSH 密钥", "steps": []}');
    expect(result.title).toBe("配置 SSH 密钥");
  });

  it("handles JSON with trailing text after code block", () => {
    const result = parseJSON('```json\n{"title": "test"}\n```\n\nHope this helps!');
    expect(result.title).toBe("test");
  });
});
