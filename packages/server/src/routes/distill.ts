import { Hono } from "hono";
import { join, dirname, basename } from "path";
import { homedir } from "os";
import { realpath } from "fs/promises";
import {
  distillSessions,
  commitPendingResult,
  listPending,
  getPending,
  updatePendingStatus,
  discardPending,
} from "@sojourn/core";

const distill = new Hono();

// --- Path safety for commit ---

const ALLOWED_WRITE_DIRS = [
  process.cwd(),
  join(homedir(), ".sojourn"),
  join(homedir(), ".claude"),
];

async function validateWritePath(p: string): Promise<void> {
  if (p.includes("..")) throw new Error("Invalid path: contains ..");
  const abs = p.startsWith("/") ? p : join(process.cwd(), p);
  const dir = dirname(abs);
  let resolvedDir: string;
  try {
    resolvedDir = await realpath(dir);
  } catch {
    try {
      resolvedDir = await realpath(dirname(dir));
    } catch {
      resolvedDir = dir;
    }
  }
  const resolved = join(resolvedDir, basename(abs));
  const allowed = ALLOWED_WRITE_DIRS.some((d) => resolved.startsWith(d));
  if (!allowed) throw new Error("Output path not allowed: resolves outside allowed directories");
}

// --- Routes ---

// Trigger distillation (synchronous — returns full result in response)
distill.post("/", async (c) => {
  try {
    const body = await c.req.json<{
      sessionPaths: string[];
      mode?: string;
      analyzer?: string;
    }>();

    const validModes = ["thought_tree", "sop", "workflow", "auto"];
    if (body.mode && !validModes.includes(body.mode)) {
      return c.json({ error: `Invalid mode: ${body.mode}` }, 400);
    }
    if (!body.sessionPaths?.length) {
      return c.json({ error: "sessionPaths is required and must be non-empty" }, 400);
    }

    const { id, result, duplicates } = await distillSessions({
      sessionPaths: body.sessionPaths,
      mode: body.mode as any,
      analyzer: body.analyzer,
    });

    return c.json({ id, result, duplicates });
  } catch (err: any) {
    console.error("Distill error:", err.message);
    return c.json({ error: err.message ?? "Distillation failed" }, 500);
  }
});

// List pending
distill.get("/pending", async (c) => {
  return c.json(await listPending());
});

// Get a distill result
distill.get("/:id", async (c) => {
  const item = await getPending(c.req.param("id"));
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

// Edit a distill result (persist changes)
distill.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json<{ resultData: any }>();
    const item = await getPending(id);
    if (!item) return c.json({ error: "Not found" }, 404);
    await updatePendingStatus(id, "editing", undefined, body.resultData);
    return c.json({ ok: true });
  } catch (err: any) {
    return c.json({ error: err.message ?? "Edit failed" }, 500);
  }
});

// Commit a distill result to a sink
distill.post("/:id/commit", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json<{ sink?: string; outputPath?: string }>();

    // Validate write path for file-based sinks if a specific sink is requested
    if (body.sink && ["claude-md", "file", "cursorrules"].includes(body.sink)) {
      await validateWritePath(body.outputPath ?? "./CLAUDE.md");
    }

    // Pass sink as-is (undefined = use config.defaultSinks fan-out)
    const committed = await commitPendingResult(id, body.sink, body.outputPath);
    return c.json({ ok: true, committedTo: committed });
  } catch (err: any) {
    return c.json({ error: err.message ?? "Commit failed" }, 500);
  }
});

// Discard
distill.delete("/:id", async (c) => {
  await discardPending(c.req.param("id"));
  return c.json({ ok: true });
});

export { distill };
