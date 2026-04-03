import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm, readFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { ClaudeMdSink } from "../packages/core/src/sink/claude-md.js";
import { FileSink } from "../packages/core/src/sink/file.js";
import type { SOPResult, ThoughtTreeResult } from "../packages/shared/src/types/result.js";

let testDir: string;

beforeAll(async () => {
  testDir = await mkdtemp(join(tmpdir(), "sojourn-sink-test-"));
});

afterAll(async () => {
  await rm(testDir, { recursive: true, force: true });
});

const sopResult: SOPResult = {
  type: "sop",
  sessionIds: ["s1"],
  createdAt: new Date().toISOString(),
  title: "Test SOP",
  summary: "A test procedure",
  steps: [
    { description: "Step 1", precondition: "Must be ready" },
    { description: "Step 2", failureBranch: "Retry step 1" },
  ],
};

const treeResult: ThoughtTreeResult = {
  type: "thought_tree",
  sessionIds: ["s2"],
  createdAt: new Date().toISOString(),
  rootQuestion: "How to fix the bug?",
  summary: "Fixed by removing cache",
  nodes: [
    { id: "1", parentId: null, nodeType: "question", label: "Bug fix", messageIds: [] },
    { id: "2", parentId: "1", nodeType: "pruning", label: "Option A", reason: "Too complex", messageIds: [] },
    { id: "3", parentId: "1", nodeType: "convergence", label: "Option B", reason: "Simple fix", messageIds: [] },
  ],
};

describe("FileSink", () => {
  it("writes JSON format", async () => {
    const path = join(testDir, "out.json");
    const sink = new FileSink(path, "json");
    await sink.write(sopResult);
    const content = await readFile(path, "utf-8");
    const parsed = JSON.parse(content);
    expect(parsed.type).toBe("sop");
    expect(parsed.title).toBe("Test SOP");
  });

  it("writes Markdown format for SOP", async () => {
    const path = join(testDir, "out-sop.md");
    const sink = new FileSink(path, "markdown");
    await sink.write(sopResult);
    const content = await readFile(path, "utf-8");
    expect(content).toContain("# Test SOP");
    expect(content).toContain("Step 1");
    expect(content).toContain("前置条件");
    expect(content).toContain("失败处理");
  });

  it("writes Markdown format for thought tree", async () => {
    const path = join(testDir, "out-tree.md");
    const sink = new FileSink(path, "markdown");
    await sink.write(treeResult);
    const content = await readFile(path, "utf-8");
    expect(content).toContain("# How to fix the bug?");
    expect(content).toContain("Option B");
  });
});

describe("ClaudeMdSink", () => {
  it("creates new file with sojourn markers", async () => {
    const path = join(testDir, "claude1.md");
    const sink = new ClaudeMdSink(path);
    await sink.write(sopResult);
    const content = await readFile(path, "utf-8");
    expect(content).toContain("<!-- sojourn:auto-generated -->");
    expect(content).toContain("<!-- sojourn:end -->");
    expect(content).toContain("Test SOP");
  });

  it("appends inside existing markers", async () => {
    const path = join(testDir, "claude2.md");
    const sink = new ClaudeMdSink(path);
    await sink.write(sopResult);
    await sink.write(treeResult);
    const content = await readFile(path, "utf-8");
    expect(content).toContain("Test SOP");
    expect(content).toContain("How to fix the bug?");
    // Only one pair of markers
    expect(content.split("<!-- sojourn:auto-generated -->").length).toBe(2);
  });

  it("preserves existing content before markers", async () => {
    const path = join(testDir, "claude3.md");
    const { writeFile: wf } = await import("fs/promises");
    await wf(path, "# My Project\n\nSome existing content.\n", "utf-8");
    const sink = new ClaudeMdSink(path);
    await sink.write(sopResult);
    const content = await readFile(path, "utf-8");
    expect(content).toContain("# My Project");
    expect(content).toContain("Some existing content.");
    expect(content).toContain("Test SOP");
  });
});
