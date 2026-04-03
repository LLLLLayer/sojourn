import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { savePending, setPendingDir } from "../packages/core/src/store.js";
import { findDuplicates } from "../packages/core/src/dedup.js";
import type { SOPResult } from "../packages/shared/src/types/result.js";

let testDir: string;

beforeAll(async () => {
  testDir = await mkdtemp(join(tmpdir(), "sojourn-dedup-test-"));
  setPendingDir(testDir);
});

afterAll(async () => {
  await rm(testDir, { recursive: true, force: true });
  setPendingDir(join(require("os").homedir(), ".sojourn", "pending"));
});

describe("findDuplicates", () => {
  it("finds no duplicates for new content", async () => {
    const result: SOPResult = {
      type: "sop", sessionIds: ["s1"], createdAt: new Date().toISOString(),
      title: "Unique SOP", steps: [{ description: "Do something unique" }],
    };
    await savePending(["s1"], result);

    const newResult: SOPResult = {
      type: "sop", sessionIds: ["s2"], createdAt: new Date().toISOString(),
      title: "Completely different", steps: [{ description: "Totally unrelated task" }],
    };
    const dups = await findDuplicates(newResult);
    expect(dups.length).toBe(0);
  });

  it("detects similar results", async () => {
    const existing: SOPResult = {
      type: "sop", sessionIds: ["s3"], createdAt: new Date().toISOString(),
      title: "Configure SSH for GitHub", steps: [
        { description: "Generate SSH key" },
        { description: "Add key to GitHub settings" },
        { description: "Test SSH connection" },
      ],
    };
    await savePending(["s3"], existing);

    const similar: SOPResult = {
      type: "sop", sessionIds: ["s4"], createdAt: new Date().toISOString(),
      title: "Setup SSH key for GitHub", steps: [
        { description: "Generate new SSH key pair" },
        { description: "Add public key to GitHub" },
        { description: "Verify SSH connection works" },
      ],
    };
    const dups = await findDuplicates(similar, 0.3);
    expect(dups.length).toBeGreaterThan(0);
    expect(dups[0].similarity).toBeGreaterThan(0.3);
  });
});
