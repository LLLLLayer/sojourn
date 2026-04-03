import { describe, it, expect } from "vitest";
import { createApp } from "../packages/server/src/app.js";

const app = createApp();

async function req(path: string, init?: RequestInit) {
  const res = await app.request(`http://localhost${path}`, init);
  return { status: res.status, json: await res.json().catch(() => null), text: await res.text().catch(() => "") };
}

describe("Server API", () => {
  describe("GET /api/health", () => {
    it("returns health info", async () => {
      const { status, json } = await req("/api/health");
      expect(status).toBe(200);
      expect(json).toHaveProperty("hookInstalled");
      expect(json).toHaveProperty("configPath");
    });
  });

  describe("GET /api/sessions", () => {
    it("returns session list array", async () => {
      const { status, json } = await req("/api/sessions");
      expect(status).toBe(200);
      expect(Array.isArray(json)).toBe(true);
    });
  });

  describe("GET /api/sessions/:id", () => {
    it("returns 404 for non-existent session", async () => {
      const { status, json } = await req("/api/sessions/nonexistent-zzz");
      expect(status).toBe(404);
      expect(json.error).toBeTruthy();
    });
  });

  describe("GET /api/config", () => {
    it("returns config with apiKey masked", async () => {
      const { status, json } = await req("/api/config");
      expect(status).toBe(200);
      expect(json).toHaveProperty("defaultAnalyzer");
      // apiKey should be masked if present
      if (json.analyzers?.["claude-api"]?.apiKey) {
        expect(json.analyzers["claude-api"].apiKey).toBe("***");
      }
    });
  });

  describe("GET /api/distill/pending", () => {
    it("returns pending list array", async () => {
      const { status, json } = await req("/api/distill/pending");
      expect(status).toBe(200);
      expect(Array.isArray(json)).toBe(true);
    });
  });

  describe("POST /api/distill", () => {
    it("returns 400 for empty sessionPaths", async () => {
      const { status, json } = await req("/api/distill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionPaths: [] }),
      });
      expect(status).toBe(400);
      expect(json.error).toContain("non-empty");
    });

    it("returns 400 for invalid mode", async () => {
      const { status, json } = await req("/api/distill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionPaths: ["/tmp/fake.jsonl"], mode: "invalid" }),
      });
      expect(status).toBe(400);
      expect(json.error).toContain("Invalid mode");
    });

    it("returns 500 for non-existent session path", async () => {
      // Use a .jsonl path so resolveSessionPath returns it as-is (no search)
      const { status, json } = await req("/api/distill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionPaths: ["/nonexistent/fake.jsonl"] }),
      });
      expect(status).toBe(500);
      expect(json.error).toBeTruthy();
    });
  });
});
