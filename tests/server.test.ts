import { describe, it, expect } from "vitest";
import { join } from "path";
import { createApp } from "../packages/server/src/app.js";

const app = createApp();
const FIXTURES = join(import.meta.dirname, "fixtures");

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

    it("returns synchronous result (not async/polling)", async () => {
      // Contract test: POST /api/distill returns { id, result } directly,
      // NOT { id, status: "processing" } which would indicate async mode.
      // This prevents accidental regression to the polling protocol.
      //
      // Uses real fixture — will call analyzer which may fail without Claude CLI,
      // but we can still verify the error response shape doesn't have "processing".
      const { status, json } = await req("/api/distill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionPaths: [join(FIXTURES, "simple-linear.jsonl")] }),
      });

      // Whether it succeeds or fails (no Claude CLI in CI), it must NOT return "processing"
      expect(json?.status).not.toBe("processing");

      if (status === 200) {
        // Success case: verify sync contract shape
        expect(json).toHaveProperty("id");
        expect(json).toHaveProperty("result");
        expect(json.result).toHaveProperty("type");
        expect(json.result).toHaveProperty("sessionIds");
      } else {
        // Error case: verify it's a real error, not a deferred task
        expect(json).toHaveProperty("error");
      }
    }, 130_000); // Long timeout in case Claude CLI actually runs

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
