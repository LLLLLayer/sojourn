import React, { useEffect, useState } from "react";
import { ChatPreview } from "../components/ChatPreview.js";

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

const PAGE_SIZE = 60;

export function SessionList({ onDistilled }: { onDistilled: (result: any) => void }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [distilling, setDistilling] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [editingAlias, setEditingAlias] = useState<string | null>(null);
  const [aliasInput, setAliasInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState<string | null>(null);
  const [previewSession, setPreviewSession] = useState<string | null>(null);

  const load = () => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((data) => { setSessions(data); setLoading(false); });
  };

  useEffect(load, []);

  const toggle = (path: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
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
      if (data.error) alert("Distill failed: " + data.error);
      else onDistilled(data.result);
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

  // Extract unique projects
  const projects = [...new Set(sessions.map((s) => s.project))];

  const filtered = sessions.filter((s) => {
    if (activeProject && s.project !== activeProject) return false;
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      s.sessionId.toLowerCase().includes(q) ||
      s.project.toLowerCase().includes(q) ||
      s.alias?.toLowerCase().includes(q) ||
      s.firstMessage?.toLowerCase().includes(q)
    );
  });

  const visible = filtered.slice(0, visibleCount);

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ color: "var(--text-muted)", fontFamily: "var(--font-display)", fontStyle: "italic", padding: 40 }}>
        Loading sessions...
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            fontWeight: 400,
            color: "var(--text-primary)",
            letterSpacing: "-0.03em",
          }}>
            Sessions
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4, fontFamily: "var(--font-mono)" }}>
            {filtered.length} sessions{selected.size > 0 ? ` · ${selected.size} selected` : ""}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Search */}
          <input
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setVisibleCount(PAGE_SIZE); }}
            placeholder="Search..."
            style={{
              width: 180,
              padding: "8px 14px",
              background: "var(--bg-elevated)",
              border: "none",
              borderRadius: "var(--radius-lg)",
              color: "var(--text-primary)",
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              outline: "none",
            }}
          />
          <button
            onClick={distill}
            disabled={selected.size === 0 || distilling}
            style={{
              background: selected.size > 0 ? "var(--accent-amber)" : "var(--bg-elevated)",
              color: selected.size > 0 ? "#fff" : "var(--text-muted)",
              border: "none",
              borderRadius: "var(--radius-lg)",
              padding: "8px 24px",
              cursor: selected.size > 0 ? "pointer" : "default",
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
              letterSpacing: "0.04em",
              transition: "all 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
              opacity: distilling ? 0.6 : 1,
            }}
          >
            {distilling ? "Distilling..." : "Distill"}
          </button>
        </div>
      </div>

      {/* Project Tabs */}
      {projects.length > 1 && (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 16,
        }}>
          <TabButton
            active={activeProject === null}
            onClick={() => { setActiveProject(null); setVisibleCount(PAGE_SIZE); }}
            count={sessions.length}
          >
            All
          </TabButton>
          {projects.map((project) => {
            const count = sessions.filter((s) => s.project === project).length;
            const label = project.split("/").pop() || project;
            const isActive = activeProject === project;
            return (
              <div key={project} style={{ display: "flex", alignItems: "center", gap: 0 }}>
                <TabButton
                  active={isActive}
                  onClick={() => { setActiveProject(project); setVisibleCount(PAGE_SIZE); setConfirmDeleteProject(null); }}
                  count={count}
                  title={project}
                >
                  {label.length > 20 ? label.slice(0, 18) + "..." : label}
                </TabButton>
                {isActive && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirmDeleteProject === project) {
                        // Confirm: delete project
                        fetch(`/api/sessions/project/${encodeURIComponent(project)}`, { method: "DELETE" })
                          .then(() => { setActiveProject(null); setConfirmDeleteProject(null); load(); });
                      } else {
                        setConfirmDeleteProject(project);
                      }
                    }}
                    style={{
                      fontSize: 10,
                      color: confirmDeleteProject === project ? "var(--accent-terracotta)" : "var(--text-muted)",
                      cursor: "pointer",
                      padding: "4px 8px",
                      fontFamily: "var(--font-mono)",
                      opacity: 0.7,
                      transition: "opacity 0.15s ease",
                    }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = "1"; }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = "0.7"; }}
                    title={confirmDeleteProject === project ? "Click again to confirm" : "Delete project"}
                  >
                    {confirmDeleteProject === project ? "confirm?" : "×"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 10,
      }}>
        {visible.map((s, i) => {
          const isSelected = selected.has(s.path);
          const displayName = s.alias || s.firstMessage || s.sessionId.slice(0, 8);

          return (
            <div
              key={s.sessionId}
              className={`animate-fade-up stagger-${Math.min(i % 8 + 1, 8)}`}
              onClick={() => setPreviewSession(s.sessionId)}
              style={{
                height: 140,
                background: isSelected ? "var(--bg-selected)" : "var(--bg-elevated)",
                border: isSelected ? "2px solid var(--accent-amber-dim)" : "2px solid transparent",
                borderRadius: "var(--radius-lg)",
                padding: "14px 16px",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
                boxShadow: isSelected ? "var(--shadow-selected)" : "none",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.boxShadow = "var(--shadow-hover)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "none";
                }
              }}
            >
              {/* Top: checkbox + date */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(s.path)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {s.modified.slice(0, 10)}
                </span>
              </div>

              {/* Title */}
              {editingAlias === s.sessionId ? (
                <input
                  value={aliasInput}
                  onChange={(e) => setAliasInput(e.target.value)}
                  onBlur={() => saveAlias(s.sessionId)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveAlias(s.sessionId); if (e.key === "Escape") setEditingAlias(null); }}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--accent-amber-dim)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    fontFamily: "var(--font-mono)",
                    padding: "2px 6px",
                    outline: "none",
                    marginBottom: 4,
                  }}
                />
              ) : (
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    fontFamily: s.alias ? "var(--font-display)" : "var(--font-mono)",
                    lineHeight: 1.4,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    marginBottom: 6,
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingAlias(s.sessionId);
                    setAliasInput(s.alias ?? "");
                  }}
                  title={displayName}
                >
                  {displayName}
                </div>
              )}

              {/* Preview */}
              {s.lastMessage && s.lastMessage !== s.firstMessage && (
                <div style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  lineHeight: 1.4,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: "vertical",
                  flex: 1,
                }}>
                  {s.lastMessage}
                </div>
              )}

              {/* Bottom: meta + actions */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "auto",
                paddingTop: 6,
              }}>
                <span style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                }}>
                  {s.messageCount} msgs · {s.sizeKB}KB
                </span>
                <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                  <MicroButton onClick={() => { setEditingAlias(s.sessionId); setAliasInput(s.alias ?? ""); }}>
                    rename
                  </MicroButton>
                  {confirmDelete === s.sessionId ? (
                    <>
                      <MicroButton color="var(--accent-terracotta)" onClick={() => deleteSession(s.sessionId)}>confirm</MicroButton>
                      <MicroButton onClick={() => setConfirmDelete(null)}>cancel</MicroButton>
                    </>
                  ) : (
                    <MicroButton color="var(--accent-terracotta)" onClick={() => setConfirmDelete(s.sessionId)}>delete</MicroButton>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load more */}
      {visibleCount < filtered.length && (
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button
            onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
            style={{
              background: "var(--bg-elevated)",
              border: "none",
              borderRadius: "var(--radius-lg)",
              color: "var(--text-secondary)",
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              padding: "10px 32px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.background = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.background = "var(--bg-elevated)"; }}
          >
            Show more ({filtered.length - visibleCount} remaining)
          </button>
        </div>
      )}
      {/* Chat Preview Modal */}
      {previewSession && (
        <ChatPreview
          sessionId={previewSession}
          onClose={() => setPreviewSession(null)}
        />
      )}
    </div>
  );
}

function TabButton({ active, onClick, count, title, children }: {
  active: boolean; onClick: () => void; count: number; title?: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: active ? "var(--accent-amber)" : "var(--bg-elevated)",
        color: active ? "#fff" : "var(--text-secondary)",
        border: "none",
        borderRadius: "var(--radius-lg)",
        padding: "6px 14px",
        fontSize: 11,
        fontFamily: "var(--font-mono)",
        cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
        whiteSpace: "nowrap",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget).style.background = "var(--bg-hover)"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget).style.background = "var(--bg-elevated)"; }}
    >
      {children}
      <span style={{
        fontSize: 10,
        opacity: active ? 0.8 : 0.5,
        fontWeight: 400,
      }}>
        {count}
      </span>
    </button>
  );
}

function MicroButton({ color, onClick, children }: {
  color?: string; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        color: color ?? "var(--text-muted)",
        border: "none",
        fontSize: 10,
        fontFamily: "var(--font-mono)",
        cursor: "pointer",
        padding: "1px 0",
        opacity: 0.6,
        transition: "opacity 0.15s ease",
      }}
      onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = "1"; }}
      onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = "0.6"; }}
    >
      {children}
    </button>
  );
}
