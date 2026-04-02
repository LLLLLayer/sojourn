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

export function SessionList({ onDistilled }: { onDistilled: (r: any) => void }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [distilling, setDistilling] = useState(false);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [previewSession, setPreviewSession] = useState<string | null>(null);
  const [editingAlias, setEditingAlias] = useState<string | null>(null);
  const [aliasInput, setAliasInput] = useState("");
  const [filter, setFilter] = useState("");

  const load = () => {
    fetch("/api/sessions").then((r) => r.json()).then((d) => { setSessions(d); setLoading(false); });
  };
  useEffect(load, []);

  const toggle = (path: string) => {
    setSelected((prev) => { const n = new Set(prev); if (n.has(path)) n.delete(path); else n.add(path); return n; });
  };

  const distill = async () => {
    if (!selected.size) return;
    setDistilling(true);
    try {
      const res = await fetch("/api/distill", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionPaths: [...selected] }) });
      const data = await res.json();
      if (data.error) alert(data.error); else onDistilled(data.result);
    } catch (e: any) { alert(e.message); }
    finally { setDistilling(false); }
  };

  const saveAlias = async (sid: string) => {
    await fetch(`/api/sessions/${sid}/alias`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ alias: aliasInput }) });
    setEditingAlias(null); load();
  };

  const projects = [...new Set(sessions.map((s) => s.project))];
  const filtered = sessions.filter((s) => {
    if (activeProject && s.project !== activeProject) return false;
    if (!filter) return true;
    const q = filter.toLowerCase();
    return s.sessionId.includes(q) || s.project.toLowerCase().includes(q) || s.alias?.toLowerCase().includes(q) || s.firstMessage?.toLowerCase().includes(q);
  });

  if (loading) return <div className="anim-in" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-serif)", fontStyle: "italic", padding: 40 }}>Loading...</div>;

  return (
    <div className="anim-up">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 26, fontWeight: 400, color: "var(--text-primary)" }}>Sessions</h2>
          <p style={{ color: "var(--text-tertiary)", fontSize: 12, marginTop: 2 }}>{filtered.length} conversations{selected.size > 0 && ` · ${selected.size} selected`}</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search..." style={{
            width: 160, padding: "6px 12px", background: "var(--bg-subtle)", border: "none", borderRadius: "var(--radius-s)", color: "var(--text-primary)", fontSize: 12, fontFamily: "var(--font-mono)", outline: "none",
          }} />
          <button onClick={distill} disabled={!selected.size || distilling} style={{
            background: selected.size ? "var(--text-primary)" : "var(--bg-muted)", color: selected.size ? "#fff" : "var(--text-tertiary)",
            border: "none", borderRadius: "var(--radius-s)", padding: "6px 20px", fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 500, cursor: selected.size ? "pointer" : "default", transition: "all 0.2s ease",
          }}>
            {distilling ? "Distilling..." : "Distill"}
          </button>
        </div>
      </div>

      {/* Project Tabs */}
      {projects.length > 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 20 }}>
          <Tab active={!activeProject} onClick={() => setActiveProject(null)}>All <Num>{sessions.length}</Num></Tab>
          {projects.map((p) => {
            const label = p.split("/").pop() || p;
            const count = sessions.filter((s) => s.project === p).length;
            return (
              <Tab key={p} active={activeProject === p} onClick={() => setActiveProject(p)} title={p}>
                {label.length > 22 ? label.slice(0, 20) + "…" : label} <Num>{count}</Num>
              </Tab>
            );
          })}
        </div>
      )}

      {/* Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 8 }}>
        {filtered.map((s, i) => {
          const isSel = selected.has(s.path);
          const name = s.alias || s.firstMessage || s.sessionId.slice(0, 8);
          return (
            <div
              key={s.sessionId}
              className={`anim-up d${(i % 6) + 1}`}
              onClick={() => setPreviewSession(s.sessionId)}
              style={{
                height: 130, padding: "12px 14px", borderRadius: "var(--radius-m)",
                background: isSel ? "var(--accent-bg)" : "var(--bg-surface)",
                border: `1.5px solid ${isSel ? "var(--accent-light)" : "var(--border-hairline)"}`,
                cursor: "pointer", display: "flex", flexDirection: "column", overflow: "hidden",
                transition: "all 0.15s ease", boxShadow: isSel ? "var(--shadow-sm)" : "none",
              }}
              onMouseEnter={(e) => { if (!isSel) { e.currentTarget.style.borderColor = "var(--border-light)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; } }}
              onMouseLeave={(e) => { if (!isSel) { e.currentTarget.style.borderColor = "var(--border-hairline)"; e.currentTarget.style.boxShadow = "none"; } }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <input type="checkbox" checked={isSel} onChange={() => toggle(s.path)} onClick={(e) => e.stopPropagation()} />
                <span style={{ flex: 1, fontSize: 10, color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>{s.modified.slice(0, 10)}</span>
                <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{s.messageCount}</span>
              </div>

              {editingAlias === s.sessionId ? (
                <input value={aliasInput} onChange={(e) => setAliasInput(e.target.value)}
                  onBlur={() => saveAlias(s.sessionId)} onKeyDown={(e) => { if (e.key === "Enter") saveAlias(s.sessionId); if (e.key === "Escape") setEditingAlias(null); }}
                  onClick={(e) => e.stopPropagation()} autoFocus
                  style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-default)", borderRadius: 4, fontSize: 12, padding: "1px 6px", fontFamily: "var(--font-mono)", outline: "none", color: "var(--text-primary)" }}
                />
              ) : (
                <div onDoubleClick={(e) => { e.stopPropagation(); setEditingAlias(s.sessionId); setAliasInput(s.alias ?? ""); }}
                  style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.35, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
                  title={name}>
                  {name}
                </div>
              )}

              <div style={{ flex: 1 }} />

              {s.lastMessage && s.lastMessage !== s.firstMessage && (
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-serif)", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.lastMessage}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {previewSession && <ChatPreview sessionId={previewSession} onClose={() => setPreviewSession(null)} />}
    </div>
  );
}

function Tab({ active, onClick, title, children }: { active: boolean; onClick: () => void; title?: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} style={{
      background: active ? "var(--text-primary)" : "var(--bg-subtle)", color: active ? "#fff" : "var(--text-secondary)",
      border: "none", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontFamily: "var(--font-mono)", cursor: "pointer",
      transition: "all 0.15s ease", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4,
    }}
    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--bg-muted)"; }}
    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "var(--bg-subtle)"; }}>
      {children}
    </button>
  );
}

function Num({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 10, opacity: 0.6 }}>{children}</span>;
}
