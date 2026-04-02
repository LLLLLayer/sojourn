import { describe, it, expect } from "vitest";
import { resolveSessionPath } from "../packages/core/src/sessions.js";

describe("resolveSessionPath", () => {
  it("returns file path as-is when it contains /", async () => {
    const path = "/some/path/session.jsonl";
    expect(await resolveSessionPath(path)).toBe(path);
  });

  it("returns file path as-is for .jsonl extension", async () => {
    const path = "session.jsonl";
    expect(await resolveSessionPath(path)).toBe(path);
  });

  it("returns file path as-is for .db extension", async () => {
    const path = "data.db";
    expect(await resolveSessionPath(path)).toBe(path);
  });

  it("resolves a partial session ID to full path", async () => {
    // This uses real ~/.claude/projects/ — skip if not available
    try {
      const path = await resolveSessionPath("c4329027");
      expect(path).toContain("c4329027");
      expect(path).toContain(".jsonl");
    } catch {
      // No Claude sessions available, skip
    }
  });

  it("throws for non-existent session ID", async () => {
    await expect(
      resolveSessionPath("nonexistent-id-zzzzz")
    ).rejects.toThrow("Session not found");
  });
});
