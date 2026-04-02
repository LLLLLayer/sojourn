import React, { useState, useEffect } from "react";
import { SessionList } from "./pages/SessionList.js";
import { ResultView } from "./pages/ResultView.js";
import { PendingList } from "./pages/PendingList.js";
import { Settings } from "./pages/Settings.js";
import { setLanguage, getLanguage, t, type Language } from "./i18n.js";

type Page = "sessions" | "pending" | "settings" | "result";

export function App() {
  const [page, setPage] = useState<Page>("sessions");
  const [resultData, setResultData] = useState<any>(null);
  const [, setLangTick] = useState(0); // force re-render on language change

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((config) => {
        if (config.language) {
          setLanguage(config.language);
          setLangTick((n) => n + 1);
        }
      })
      .catch(() => {});
  }, []);

  const toggleLang = () => {
    const next: Language = getLanguage() === "zh" ? "en" : "zh";
    setLanguage(next);
    setLangTick((n) => n + 1);
    // Persist
    fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: next }),
    }).catch(() => {});
  };

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
            {t("app.title")}
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
            {t("app.subtitle")}
          </p>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <NavItem
            active={page === "sessions"}
            onClick={() => setPage("sessions")}
            label={t("nav.sessions")}
            shortcut="S"
            delay={1}
          />
          <NavItem
            active={page === "pending"}
            onClick={() => setPage("pending")}
            label={t("nav.pending")}
            shortcut="P"
            delay={2}
          />
          <NavItem
            active={page === "settings"}
            onClick={() => setPage("settings")}
            label="Settings"
            shortcut="/"
            delay={3}
          />
        </nav>

        <div style={{ flex: 1 }} />

        <div
          className="animate-fade-in"
          style={{ padding: "0 24px" }}
        >
          <span style={{
            fontSize: 10,
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
          }}>
            {t("app.version")}
          </span>
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
        {page === "settings" && <Settings />}
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
