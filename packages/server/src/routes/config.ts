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
  // loadConfig already deep-merges defaults; we reload to get full state,
  // then deep-merge the incoming body on top so nested fields are preserved.
  const existing = await loadConfig();
  const merged = deepMergeObj(existing, body);
  // Don't let client overwrite apiKey with "***"
  if (merged.analyzers) {
    for (const key of Object.keys(merged.analyzers)) {
      if (merged.analyzers[key]?.apiKey === "***") {
        merged.analyzers[key].apiKey = (existing as any).analyzers?.[key]?.apiKey;
      }
    }
  }
  await saveConfig(merged);
  return c.json({ ok: true });
});

function deepMergeObj(base: any, override: any): any {
  const result = { ...base };
  for (const key of Object.keys(override)) {
    const bv = base[key], ov = override[key];
    if (bv && ov && typeof bv === "object" && !Array.isArray(bv) && typeof ov === "object" && !Array.isArray(ov)) {
      result[key] = deepMergeObj(bv, ov);
    } else if (ov !== undefined) {
      result[key] = ov;
    }
  }
  return result;
}

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
