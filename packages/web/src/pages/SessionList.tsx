import React, { useEffect, useState } from "react";
import { t } from "../i18n.js";

interface Session {
  sessionId: string;
  project: string;
  path: string;
  modified: string;
  sizeKB: number;
}

export function SessionList({
  onDistilled,
}: {
  onDistilled: (result: any) => void;
}) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [distilling, setDistilling] = useState(false);

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((data) => {
        setSessions(data);
        setLoading(false);
      });
  }, []);

  const toggle = (path: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const distill = async () => {
    if (selected.size === 0) return;
    setDistilling(true);
    try {
      const res = await fetch("/api/distill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionPaths: [...selected] }),
      });
      const data = await res.json();
      if (data.error) {
        alert("Distill failed: " + data.error);
      } else {
        onDistilled(data.result);
      }
    } catch (e) {
      alert("Distill failed: " + (e as Error).message);
    } finally {
      setDistilling(false);
    }
  };

  const grouped = new Map<string, Session[]>();
  for (const s of sessions) {
    if (!grouped.has(s.project)) grouped.set(s.project, []);
    grouped.get(s.project)!.push(s);
  }

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ color: "var(--text-muted)", fontStyle: "italic", fontFamily: "var(--font-display)" }}>
        {t("sessions.loading")}
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 28,
              fontWeight: 400,
              color: "var(--text-primary)",
              letterSpacing: "-0.03em",
            }}
          >
            {t("sessions.title")}
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4, fontFamily: "var(--font-mono)" }}>
            {t("sessions.count", sessions.length, selected.size)}
          </p>
        </div>

        <button
          onClick={distill}
          disabled={selected.size === 0 || distilling}
          style={{
            background: selected.size > 0 ? "var(--accent-amber)" : "var(--bg-elevated)",
            color: selected.size > 0 ? "var(--bg-deep)" : "var(--text-muted)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            padding: "10px 28px",
            cursor: selected.size > 0 ? "pointer" : "default",
            fontSize: 12,
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            transition: "all 0.3s ease",
            opacity: distilling ? 0.6 : 1,
          }}
        >
          {distilling ? t("sessions.distilling") : t("sessions.distill")}
        </button>
      </div>

      {/* Session Groups */}
      {[...grouped.entries()].map(([project, items], gi) => (
        <div
          key={project}
          className={`animate-fade-up stagger-${Math.min(gi + 1, 8)}`}
          style={{ marginBottom: 28 }}
        >
          <h3
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              marginBottom: 8,
              fontWeight: 400,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontFamily: "var(--font-mono)",
              borderBottom: "1px solid var(--border-subtle)",
              paddingBottom: 6,
            }}
          >
            {project}
          </h3>
          {items.map((s) => {
            const isSelected = selected.has(s.path);
            return (
              <label
                key={s.path}
                style={{
                  display: "grid",
                  gridTemplateColumns: "20px 140px 55px 1fr",
                  alignItems: "center",
                  gap: 12,
                  padding: "9px 12px",
                  borderRadius: "var(--radius-sm)",
                  background: isSelected ? "var(--bg-selected)" : "transparent",
                  borderLeft: isSelected ? "2px solid var(--accent-amber-dim)" : "2px solid transparent",
                  cursor: "pointer",
                  fontSize: 12,
                  marginBottom: 1,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(s.path)}
                />
                <span style={{ color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
                  {s.modified.slice(0, 16).replace("T", " ")}
                </span>
                <span style={{ color: "var(--text-muted)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                  {s.sizeKB}KB
                </span>
                <span
                  style={{
                    color: isSelected ? "var(--text-warm)" : "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    opacity: 0.8,
                  }}
                >
                  {s.sessionId}
                </span>
              </label>
            );
          })}
        </div>
      ))}
    </div>
  );
}
