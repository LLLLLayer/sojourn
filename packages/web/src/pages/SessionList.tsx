import React, { useEffect, useState } from "react";
import { t } from "../i18n.js";

interface Session {
  sessionId: string;
  project: string;
  path: string;
  modified: string;
  sizeKB: number;
  alias: string | null;
  firstMessage: string | null;
  lastMessage: string | null;
  messageCount: number;
}

const DEFAULT_VISIBLE = 3;

export function SessionList({ onDistilled }: { onDistilled: (result: any) => void }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [distilling, setDistilling] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingAlias, setEditingAlias] = useState<string | null>(null);
  const [aliasInput, setAliasInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = () => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((data) => {
        setSessions(data);
        setLoading(false);
      });
  };

  useEffect(load, []);

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

  const saveAlias = async (sessionId: string) => {
    await fetch(`/api/sessions/${sessionId}/alias`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alias: aliasInput }),
    });
    setEditingAlias(null);
    load();
  };

  const deleteSession = async (sessionId: string) => {
    await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
    setConfirmDelete(null);
    load();
  };

  const toggleExpand = (project: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(project)) next.delete(project);
      else next.add(project);
      return next;
    });
  };

  // Group by project
  const grouped = new Map<string, Session[]>();
  for (const s of sessions) {
    if (!grouped.has(s.project)) grouped.set(s.project, []);
    grouped.get(s.project)!.push(s);
  }

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ color: "var(--text-muted)", fontFamily: "var(--font-display)", fontStyle: "italic" }}>
        {t("sessions.loading")}
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            fontWeight: 400,
            color: "var(--text-primary)",
            letterSpacing: "-0.03em",
          }}>
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
            color: selected.size > 0 ? "#fff" : "var(--text-muted)",
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

      {/* Project Groups */}
      {[...grouped.entries()].map(([project, items], gi) => {
        const isExpanded = expanded.has(project);
        const visibleItems = isExpanded ? items : items.slice(0, DEFAULT_VISIBLE);
        const hasMore = items.length > DEFAULT_VISIBLE;

        return (
          <div
            key={project}
            className={`animate-fade-up stagger-${Math.min(gi + 1, 8)}`}
            style={{ marginBottom: 24 }}
          >
            {/* Project Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}>
              <span style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontWeight: 400,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontFamily: "var(--font-mono)",
              }}>
                {project}
              </span>
              <span style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
              <span style={{
                fontSize: 10,
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
              }}>
                {items.length}
              </span>
            </div>

            {/* Session Cards */}
            {visibleItems.map((s) => {
              const isSelected = selected.has(s.path);
              const displayName = s.alias || s.firstMessage || s.sessionId;

              return (
                <div
                  key={s.sessionId}
                  style={{
                    background: "var(--bg-surface)",
                    border: isSelected
                      ? "1px solid var(--accent-amber-dim)"
                      : "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    padding: "14px 16px",
                    marginBottom: 6,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: isSelected ? "0 1px 4px rgba(0,0,0,0.04)" : "none",
                  }}
                  onClick={() => toggle(s.path)}
                  onMouseEnter={(e) => {
                    if (!isSelected) (e.currentTarget).style.borderColor = "var(--border-default)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) (e.currentTarget).style.borderColor = "var(--border-subtle)";
                  }}
                >
                  {/* Top row: checkbox + name + meta */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(s.path)}
                      onClick={(e) => e.stopPropagation()}
                    />

                    {editingAlias === s.sessionId ? (
                      <input
                        value={aliasInput}
                        onChange={(e) => setAliasInput(e.target.value)}
                        onBlur={() => saveAlias(s.sessionId)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveAlias(s.sessionId); if (e.key === "Escape") setEditingAlias(null); }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        style={{
                          flex: 1,
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--accent-amber-dim)",
                          borderRadius: "var(--radius-sm)",
                          color: "var(--text-primary)",
                          fontSize: 13,
                          fontFamily: "var(--font-mono)",
                          padding: "2px 8px",
                          outline: "none",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          flex: 1,
                          fontSize: 13,
                          color: "var(--text-primary)",
                          fontFamily: s.alias ? "var(--font-display)" : "var(--font-mono)",
                          fontWeight: s.alias ? 500 : 300,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditingAlias(s.sessionId);
                          setAliasInput(s.alias ?? "");
                        }}
                        title="Double-click to rename"
                      >
                        {displayName}
                      </span>
                    )}

                    <span style={{
                      fontSize: 10,
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-mono)",
                      fontVariantNumeric: "tabular-nums",
                      flexShrink: 0,
                    }}>
                      {s.modified.slice(0, 10)}
                    </span>
                    <span style={{
                      fontSize: 10,
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-mono)",
                      flexShrink: 0,
                    }}>
                      {s.messageCount} msgs
                    </span>
                  </div>

                  {/* Preview messages */}
                  <div style={{ marginLeft: 26, fontSize: 12, lineHeight: 1.5 }}>
                    {s.firstMessage && (
                      <div style={{
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-display)",
                        fontStyle: "italic",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {s.firstMessage}
                      </div>
                    )}
                    {s.lastMessage && s.lastMessage !== s.firstMessage && (
                      <div style={{
                        color: "var(--text-muted)",
                        fontFamily: "var(--font-display)",
                        fontStyle: "italic",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        marginTop: 2,
                      }}>
                        ... {s.lastMessage}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div
                    style={{ display: "flex", gap: 8, marginTop: 8, marginLeft: 26 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MicroButton
                      onClick={() => {
                        setEditingAlias(s.sessionId);
                        setAliasInput(s.alias ?? "");
                      }}
                    >
                      rename
                    </MicroButton>
                    {confirmDelete === s.sessionId ? (
                      <>
                        <MicroButton color="var(--accent-terracotta)" onClick={() => deleteSession(s.sessionId)}>
                          confirm delete
                        </MicroButton>
                        <MicroButton onClick={() => setConfirmDelete(null)}>
                          cancel
                        </MicroButton>
                      </>
                    ) : (
                      <MicroButton
                        color="var(--accent-terracotta)"
                        onClick={() => setConfirmDelete(s.sessionId)}
                      >
                        delete
                      </MicroButton>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Expand/Collapse */}
            {hasMore && (
              <button
                onClick={() => toggleExpand(project)}
                style={{
                  display: "block",
                  width: "100%",
                  background: "transparent",
                  border: "1px dashed var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-muted)",
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  padding: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  marginTop: 2,
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.borderColor = "var(--border-default)";
                  (e.target as HTMLElement).style.color = "var(--text-secondary)";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.borderColor = "var(--border-subtle)";
                  (e.target as HTMLElement).style.color = "var(--text-muted)";
                }}
              >
                {isExpanded
                  ? `collapse (showing ${items.length})`
                  : `show ${items.length - DEFAULT_VISIBLE} more...`}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MicroButton({
  color,
  onClick,
  children,
}: {
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const c = color ?? "var(--text-muted)";
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        color: c,
        border: "none",
        fontSize: 10,
        fontFamily: "var(--font-mono)",
        cursor: "pointer",
        padding: "2px 0",
        letterSpacing: "0.04em",
        transition: "opacity 0.2s ease",
        opacity: 0.7,
      }}
      onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = "1"; }}
      onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = "0.7"; }}
    >
      {children}
    </button>
  );
}
