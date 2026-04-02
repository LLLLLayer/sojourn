import { describe, it, expect } from "vitest";
import { join } from "path";
import { ClaudeCodeParser } from "../packages/core/src/parser/claude.js";
import { isLinear, getMainChain, getBranches } from "../packages/shared/src/types/message.js";

const FIXTURES = join(import.meta.dirname, "fixtures");

describe("ClaudeCodeParser", () => {
  const parser = new ClaudeCodeParser();

  describe("simple linear conversation", () => {
    it("parses all messages", async () => {
      const tree = await parser.parse(join(FIXTURES, "simple-linear.jsonl"));
      expect(tree.messages.size).toBe(6);
      expect(tree.sessionId).toBe("test-session-1");
    });

    it("identifies as linear", async () => {
      const tree = await parser.parse(join(FIXTURES, "simple-linear.jsonl"));
      expect(isLinear(tree)).toBe(true);
    });

    it("has no branches", async () => {
      const tree = await parser.parse(join(FIXTURES, "simple-linear.jsonl"));
      expect(getBranches(tree)).toHaveLength(0);
    });

    it("preserves parent-child relationships", async () => {
      const tree = await parser.parse(join(FIXTURES, "simple-linear.jsonl"));
      const msg2 = tree.messages.get("msg-2");
      expect(msg2?.parentId).toBe("msg-1");
    });

    it("extracts tool uses", async () => {
      const tree = await parser.parse(join(FIXTURES, "simple-linear.jsonl"));
      const msg2 = tree.messages.get("msg-2");
      expect(msg2?.toolUses).toHaveLength(1);
      expect(msg2?.toolUses[0].name).toBe("Bash");
    });

    it("builds correct main chain", async () => {
      const tree = await parser.parse(join(FIXTURES, "simple-linear.jsonl"));
      const chain = getMainChain(tree);
      expect(chain).toHaveLength(6);
      expect(chain[0].id).toBe("msg-1");
      expect(chain[5].id).toBe("msg-6");
    });
  });

  describe("branching conversation", () => {
    it("parses all messages including sidechains", async () => {
      const tree = await parser.parse(join(FIXTURES, "branching.jsonl"));
      expect(tree.messages.size).toBe(7);
    });

    it("identifies as non-linear", async () => {
      const tree = await parser.parse(join(FIXTURES, "branching.jsonl"));
      expect(isLinear(tree)).toBe(false);
    });

    it("detects sidechain messages", async () => {
      const tree = await parser.parse(join(FIXTURES, "branching.jsonl"));
      const sidechain = tree.messages.get("b-3");
      expect(sidechain?.isSidechain).toBe(true);
    });

    it("finds branches", async () => {
      const tree = await parser.parse(join(FIXTURES, "branching.jsonl"));
      const branches = getBranches(tree);
      expect(branches.length).toBeGreaterThan(0);
    });

    it("main chain excludes sidechains", async () => {
      const tree = await parser.parse(join(FIXTURES, "branching.jsonl"));
      const chain = getMainChain(tree);
      const ids = chain.map((m) => m.id);
      expect(ids).not.toContain("b-3");
      expect(ids).not.toContain("b-6");
    });
  });

  describe("deduplication", () => {
    it("keeps last occurrence of duplicate uuid", async () => {
      const tree = await parser.parse(join(FIXTURES, "dedup.jsonl"));
      expect(tree.messages.size).toBe(2); // d-1 + d-2 (deduped)
    });

    it("uses final content for deduplicated message", async () => {
      const tree = await parser.parse(join(FIXTURES, "dedup.jsonl"));
      const msg = tree.messages.get("d-2");
      expect(msg?.content).toBe("Final complete response.");
    });
  });

  describe("version detection", () => {
    it("returns null for fixtures without version", async () => {
      const version = await parser.detectVersion(
        join(FIXTURES, "simple-linear.jsonl")
      );
      expect(version).toBeNull();
    });
  });
});
