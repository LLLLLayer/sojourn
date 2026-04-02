import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { sessions } from "./routes/sessions.js";
import { distill } from "./routes/distill.js";
import { config } from "./routes/config.js";
import { health } from "./routes/health.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATIC_DIR = join(__dirname, "..", "static");

export function createApp() {
  const app = new Hono();

  app.use("/*", cors({
    origin: ["http://localhost:7878", "http://127.0.0.1:7878"],
  }));

  // API routes
  app.route("/api/sessions", sessions);
  app.route("/api/distill", distill);
  app.route("/api/config", config);
  app.route("/api/health", health);

  // Serve static frontend
  app.use("/*", serveStatic({ root: STATIC_DIR }));

  // SPA fallback — serve index.html for non-API routes
  app.get("*", async (c) => {
    const { readFile } = await import("fs/promises");
    try {
      const html = await readFile(join(STATIC_DIR, "index.html"), "utf-8");
      return c.html(html);
    } catch {
      return c.text("Frontend not built. Run: pnpm build", 404);
    }
  });

  return app;
}

export function startServer(port = 7878) {
  const app = createApp();

  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`Sojourn server running at http://localhost:${info.port}`);
  });

  return app;
}
