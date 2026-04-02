import { describe, it, expect, beforeEach } from "vitest";
import { readdir, rm } from "fs/promises";
import { join } from "path";
import { homedir } from "os";
import {
  savePending,
  listPending,
  getPending,
  updatePendingStatus,
  discardPending,
} from "../packages/core/src/store.js";
import type { SOPResult } from "../packages/shared/src/types/result.js";

const PENDING_DIR = join(homedir(), ".sojourn", "pending");

const mockResult: SOPResult = {
  type: "sop",
  sessionIds: ["test-session"],
  createdAt: new Date(),
  title: "Test SOP",
  steps: [{ description: "Step 1" }],
};

describe("Store", () => {
  it("saves and retrieves a pending result", async () => {
    const id = await savePending(["test-session"], mockResult);
    expect(id).toBeTruthy();

    const item = await getPending(id);
    expect(item).not.toBeNull();
    expect(item?.status).toBe("pending");
    expect(item?.resultType).toBe("sop");
  });

  it("lists pending results", async () => {
    const items = await listPending();
    expect(items.length).toBeGreaterThan(0);
  });

  it("updates status", async () => {
    const id = await savePending(["test-session"], mockResult);
    await updatePendingStatus(id, "committed", "claude-md");

    const item = await getPending(id);
    expect(item?.status).toBe("committed");
    expect(item?.committedTo).toBe("claude-md");
  });

  it("discards a result", async () => {
    const id = await savePending(["test-session"], mockResult);
    await discardPending(id);

    const item = await getPending(id);
    expect(item?.status).toBe("discarded");
  });
});
