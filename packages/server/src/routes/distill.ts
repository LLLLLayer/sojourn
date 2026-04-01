import { Hono } from "hono";
import {
  parserRegistry,
  analyzerRegistry,
  classify,
  classifyMulti,
  detectFormat,
  savePending,
  listPending,
  getPending,
  updatePendingStatus,
  discardPending,
  ClaudeMdSink,
  FileSink,
  GitRepoSink,
  getActiveRepo,
} from "@sojourn/core";
import type { DistillMode, MessageTree } from "@sojourn/shared";

const distill = new Hono();

// Trigger distillation
distill.post("/", async (c) => {
  try {
    const body = await c.req.json<{
      sessionPaths: string[];
      mode?: string;
      analyzer?: string;
    }>();

    // Parse all sessions (auto-detect format)
    const trees: MessageTree[] = [];
    for (const path of body.sessionPaths) {
      const format = await detectFormat(path);
      const parserName = format === "unknown" ? "claude-code" : format;
      const parser = parserRegistry.get(parserName);
      trees.push(await parser.parse(path));
    }

    let mode: Exclude<DistillMode, "auto">;
    if (body.mode && body.mode !== "auto") {
      mode = body.mode as Exclude<DistillMode, "auto">;
    } else if (trees.length > 1) {
      mode = classifyMulti(trees);
    } else {
      mode = classify(trees[0]);
    }

    const analyzerName = body.analyzer ?? "claude-code";
    const analyzer = analyzerRegistry.get(analyzerName);

    const result =
      trees.length > 1
        ? await analyzer.analyzeMulti(trees, mode)
        : await analyzer.analyze(trees[0], mode);

    const id = await savePending(
      trees.map((t) => t.sessionId),
      result
    );

    return c.json({ id, result });
  } catch (err: any) {
    console.error("Distill error:", err.message);
    return c.json(
      { error: err.message ?? "Distillation failed" },
      500
    );
  }
});

// List pending
distill.get("/pending", async (c) => {
  const items = await listPending();
  return c.json(items);
});

// Get a distill result
distill.get("/:id", async (c) => {
  const item = await getPending(c.req.param("id"));
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

// Edit a distill result
distill.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ resultData: any }>();
  const item = await getPending(id);
  if (!item) return c.json({ error: "Not found" }, 404);

  item.resultData = body.resultData;
  item.status = "editing";
  await updatePendingStatus(id, "editing");
  return c.json({ ok: true });
});

// Commit a distill result to a sink
distill.post("/:id/commit", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json<{
      sink: string;
      outputPath?: string;
    }>();

    const item = await getPending(id);
    if (!item) return c.json({ error: "Not found" }, 404);

    const sinkName = body.sink ?? "claude-md";
    const outputPath = body.outputPath ?? "./CLAUDE.md";

    if (sinkName === "claude-md") {
      await new ClaudeMdSink(outputPath).write(item.resultData);
    } else if (sinkName === "file") {
      const format = outputPath.endsWith(".json")
        ? ("json" as const)
        : ("markdown" as const);
      await new FileSink(outputPath, format).write(item.resultData);
    } else if (sinkName === "git-repo") {
      const repo = await getActiveRepo();
      if (!repo) return c.json({ error: "No active repo" }, 400);
      await new GitRepoSink({
        repoUrl: repo.url,
        repoName: repo.name,
      }).write(item.resultData);
    }

    await updatePendingStatus(id, "committed", sinkName);
    return c.json({ ok: true, committedTo: sinkName });
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
