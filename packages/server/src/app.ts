import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { sessions } from "./routes/sessions.js";
import { distill } from "./routes/distill.js";
import { config } from "./routes/config.js";
import { health } from "./routes/health.js";

export function createApp() {
  const app = new Hono();

  app.use("/*", cors());

  // API routes
  app.route("/api/sessions", sessions);
  app.route("/api/distill", distill);
  app.route("/api/config", config);
  app.route("/api/health", health);

  // Serve static frontend (in production)
  app.use("/*", serveStatic({ root: "./static" }));

  return app;
}

export function startServer(port = 7878) {
  const app = createApp();

  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`Sojourn server running at http://localhost:${info.port}`);
  });

  return app;
}
