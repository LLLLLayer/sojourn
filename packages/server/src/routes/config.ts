import { Hono } from "hono";
import {
  loadConfig,
  saveConfig,
  bindRepo,
  unbindRepo,
  switchRepo,
} from "@sojourn/core";

const config = new Hono();

// Strip sensitive fields before returning to client
function sanitizeConfig(cfg: any): any {
  const clone = JSON.parse(JSON.stringify(cfg));
  if (clone.analyzers) {
    for (const key of Object.keys(clone.analyzers)) {
      if (clone.analyzers[key]?.apiKey) {
        clone.analyzers[key].apiKey = "***";
      }
    }
  }
  return clone;
}

config.get("/", async (c) => {
  const cfg = await loadConfig();
  return c.json(sanitizeConfig(cfg));
});

config.put("/", async (c) => {
  const body = await c.req.json();
  // Merge with existing config to preserve fields not sent by client
  const existing = await loadConfig();
  const merged = { ...existing, ...body };
  // Don't let client overwrite apiKey with "***"
  if (body.analyzers) {
    for (const key of Object.keys(body.analyzers)) {
      if (body.analyzers[key]?.apiKey === "***") {
        merged.analyzers[key].apiKey = existing.analyzers?.[key]?.apiKey;
      }
    }
  }
  await saveConfig(merged);
  return c.json({ ok: true });
});

config.post("/bind-repo", async (c) => {
  const { name, url } = await c.req.json<{ name: string; url: string }>();
  await bindRepo(name, url);
  return c.json({ ok: true });
});

config.delete("/unbind-repo/:name", async (c) => {
  await unbindRepo(c.req.param("name"));
  return c.json({ ok: true });
});

config.post("/switch-repo", async (c) => {
  const { name } = await c.req.json<{ name: string }>();
  await switchRepo(name);
  return c.json({ ok: true });
});

export { config };
