import { Hono } from "hono";
import {
  loadConfig,
  saveConfig,
  bindRepo,
  unbindRepo,
  switchRepo,
} from "@sojourn/core";

const config = new Hono();

config.get("/", async (c) => {
  return c.json(await loadConfig());
});

config.put("/", async (c) => {
  const body = await c.req.json();
  await saveConfig(body);
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
