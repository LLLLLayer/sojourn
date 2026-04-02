import React, { useState, useEffect } from "react";
import { SessionList } from "./pages/SessionList.js";
import { ResultView } from "./pages/ResultView.js";
import { PendingList } from "./pages/PendingList.js";
import { Settings } from "./pages/Settings.js";
import { setLanguage, t, type Language } from "./i18n.js";

type Page = "sessions" | "pending" | "settings" | "result";

export function App() {
  const [page, setPage] = useState<Page>("sessions");
  const [resultData, setResultData] = useState<any>(null);
  const [, setLangTick] = useState(0);

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

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      padding: 12,
      gap: 12,
      background: "var(--bg-deep)",
    }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 200,
          borderRadius: "var(--radius-xl)",
          padding: "28px 0",
          flexShrink: 0,
          background: "var(--bg-surface)",
          boxShadow: "var(--shadow-card)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          className="animate-fade-in"
          style={{ padding: "0 22px", marginBottom: 40 }}
        >
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: 21,
            fontWeight: 500,
            color: "var(--text-warm)",
            letterSpacing: "-0.02em",
          }}>
            {t("app.title")}
          </h1>
          <p style={{
            fontFamily: "var(--font-display)",
            fontSize: 11,
            color: "var(--text-muted)",
            fontStyle: "italic",
            marginTop: 3,
          }}>
            {t("app.subtitle")}
          </p>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 8px" }}>
          {([
            { key: "sessions" as Page, label: t("nav.sessions"), icon: "S" },
            { key: "pending" as Page, label: t("nav.pending"), icon: "P" },
            { key: "settings" as Page, label: "Settings", icon: "/" },
          ]).map((item, i) => (
            <NavItem
              key={item.key}
              active={page === item.key}
              onClick={() => setPage(item.key)}
              label={item.label}
              shortcut={item.icon}
              delay={i + 1}
            />
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        <div
          className="animate-fade-in"
          style={{ padding: "0 22px" }}
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

      {/* Main */}
      <main style={{
        flex: 1,
        borderRadius: "var(--radius-xl)",
        background: "var(--bg-surface)",
        boxShadow: "var(--shadow-card)",
        padding: "36px 44px",
        overflow: "auto",
        minWidth: 0,
      }}>
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
          <ResultView result={resultData} onBack={() => setPage("sessions")} />
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
        padding: "9px 14px",
        background: active ? "var(--bg-selected)" : "transparent",
        color: active ? "var(--text-warm)" : "var(--text-secondary)",
        border: "none",
        borderRadius: "var(--radius-md)",
        cursor: "pointer",
        fontSize: 13,
        fontFamily: "var(--font-mono)",
        fontWeight: active ? 500 : 300,
        letterSpacing: "0.01em",
        transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget).style.background = "var(--bg-hover)";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget).style.background = "transparent";
      }}
    >
      {label}
      <span style={{
        fontSize: 10,
        color: "var(--text-muted)",
        fontWeight: 300,
        opacity: 0.5,
      }}>
        {shortcut}
      </span>
    </button>
  );
}
