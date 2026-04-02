import React, { useState, useEffect } from "react";
import { SessionList } from "./pages/SessionList.js";
import { ResultView } from "./pages/ResultView.js";
import { PendingList } from "./pages/PendingList.js";
import { Settings } from "./pages/Settings.js";

type Page = "sessions" | "pending" | "settings" | "result";

export function App() {
  const [page, setPage] = useState<Page>("sessions");
  const [resultData, setResultData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/config").then((r) => r.json()).then((config) => {
      if (config.fontSize) {
        const scale = config.fontSize / 15;
        document.documentElement.style.zoom = String(scale);
      }
    }).catch(() => {});
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside style={{
        width: 180,
        padding: "28px 0",
        flexShrink: 0,
        borderRight: "1px solid var(--border-hairline)",
        background: "var(--bg-surface)",
        display: "flex",
        flexDirection: "column",
      }}>
        <div className="anim-in" style={{ padding: "0 20px", marginBottom: 36 }}>
          <h1 style={{
            fontFamily: "var(--font-serif)",
            fontSize: 22,
            fontWeight: 400,
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
          }}>
            Sojourn
          </h1>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 1, padding: "0 8px" }}>
          {([
            { key: "sessions" as Page, label: "Sessions" },
            { key: "pending" as Page, label: "Pending" },
            { key: "settings" as Page, label: "Settings" },
          ]).map((item, i) => {
            const active = page === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setPage(item.key)}
                className={`anim-slide d${i + 1}`}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "7px 12px",
                  background: active ? "var(--bg-active)" : "transparent",
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                  border: "none",
                  borderRadius: "var(--radius-s)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: "var(--font-mono)",
                  fontWeight: active ? 500 : 400,
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--bg-subtle)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />
        <div style={{ padding: "0 20px", fontSize: 10, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
          v0.1.0
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: "32px 40px", overflow: "auto", minWidth: 0 }}>
        {page === "sessions" && (
          <SessionList onDistilled={(r) => { setResultData(r); setPage("result"); }} />
        )}
        {page === "pending" && <PendingList />}
        {page === "settings" && <Settings />}
        {page === "result" && resultData && (
          <ResultView result={resultData} onBack={() => setPage("sessions")} />
        )}
      </main>
    </div>
  );
}
