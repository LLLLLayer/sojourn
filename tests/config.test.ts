import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm, readFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

// We test the nested value helpers by importing the config module
// and overriding the config path isn't easy, so test the logic directly
describe("Config nested value helpers", () => {
  // Replicate the logic from config.ts
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

  it("gets top-level value", () => {
    expect(getNestedValue({ a: 1 }, "a")).toBe(1);
  });

  it("gets nested value", () => {
    expect(getNestedValue({ a: { b: { c: 42 } } }, "a.b.c")).toBe(42);
  });

  it("returns undefined for missing path", () => {
    expect(getNestedValue({ a: 1 }, "b")).toBeUndefined();
  });

  it("returns undefined for deep missing path", () => {
    expect(getNestedValue({ a: 1 }, "a.b.c")).toBeUndefined();
  });

  it("sets top-level value", () => {
    const obj: any = {};
    setNestedValue(obj, "a", 1);
    expect(obj.a).toBe(1);
  });

  it("sets nested value, creating intermediates", () => {
    const obj: any = {};
    setNestedValue(obj, "a.b.c", 42);
    expect(obj.a.b.c).toBe(42);
  });

  it("overwrites existing value", () => {
    const obj: any = { a: { b: 1 } };
    setNestedValue(obj, "a.b", 2);
    expect(obj.a.b).toBe(2);
  });

  it("overwrites non-object intermediate", () => {
    const obj: any = { a: "string" };
    setNestedValue(obj, "a.b", 1);
    expect(obj.a.b).toBe(1);
  });
});
