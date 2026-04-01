import React, { useState } from "react";
import { SessionList } from "./pages/SessionList.js";
import { ResultView } from "./pages/ResultView.js";
import { PendingList } from "./pages/PendingList.js";

type Page = "sessions" | "pending" | "result";

export function App() {
  const [page, setPage] = useState<Page>("sessions");
  const [resultData, setResultData] = useState<any>(null);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          borderRight: "1px solid var(--border-subtle)",
          padding: "32px 0",
          flexShrink: 0,
          background: "var(--bg-elevated)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          className="animate-fade-in"
          style={{ padding: "0 24px", marginBottom: 48 }}
        >
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              fontWeight: 500,
              color: "var(--text-warm)",
              letterSpacing: "-0.02em",
            }}
          >
            Sojourn
          </h1>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 11,
              color: "var(--text-muted)",
              fontStyle: "italic",
              marginTop: 4,
              letterSpacing: "0.04em",
            }}
          >
            knowledge distillation
          </p>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <NavItem
            active={page === "sessions"}
            onClick={() => setPage("sessions")}
            label="Sessions"
            shortcut="S"
            delay={1}
          />
          <NavItem
            active={page === "pending"}
            onClick={() => setPage("pending")}
            label="Pending"
            shortcut="P"
            delay={2}
          />
        </nav>

        <div style={{ flex: 1 }} />

        <div
          className="animate-fade-in"
          style={{
            padding: "0 24px",
            fontSize: 10,
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          v0.1.0
        </div>
      </aside>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          padding: "40px 48px",
          maxWidth: 880,
          overflow: "auto",
        }}
      >
        {page === "sessions" && (
          <SessionList
            onDistilled={(result) => {
              setResultData(result);
              setPage("result");
            }}
          />
        )}
        {page === "pending" && <PendingList />}
        {page === "result" && resultData && (
          <ResultView
            result={resultData}
            onBack={() => setPage("sessions")}
          />
        )}
      </main>
    </div>
  );
}

function NavItem({
  active,
  onClick,
  label,
  shortcut,
  delay,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  shortcut: string;
  delay: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`animate-slide-in stagger-${delay}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 24px",
        background: active ? "var(--bg-selected)" : "transparent",
        color: active ? "var(--text-warm)" : "var(--text-secondary)",
        border: "none",
        borderLeft: active
          ? "2px solid var(--accent-amber)"
          : "2px solid transparent",
        cursor: "pointer",
        fontSize: 13,
        fontFamily: "var(--font-mono)",
        fontWeight: active ? 400 : 300,
        letterSpacing: "0.02em",
        transition: "all 0.2s ease",
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        if (!active)
          (e.target as HTMLElement).style.background = "var(--bg-hover)";
      }}
      onMouseLeave={(e) => {
        if (!active)
          (e.target as HTMLElement).style.background = "transparent";
      }}
    >
      {label}
      <span
        style={{
          fontSize: 10,
          color: "var(--text-muted)",
          fontWeight: 300,
          opacity: 0.6,
        }}
      >
        {shortcut}
      </span>
    </button>
  );
}
