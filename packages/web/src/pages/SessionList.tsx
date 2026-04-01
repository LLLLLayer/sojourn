import React, { useEffect, useState } from "react";

interface Session {
  sessionId: string;
  project: string;
  path: string;
  modified: string;
  sizeKB: number;
}

export function SessionList({ onDistilled }: { onDistilled: (result: any) => void }) {
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
      onDistilled(data.result);
    } catch (e) {
      alert("Distill failed: " + (e as Error).message);
    } finally {
      setDistilling(false);
    }
  };

  // Group by project
  const grouped = new Map<string, Session[]>();
  for (const s of sessions) {
    if (!grouped.has(s.project)) grouped.set(s.project, []);
    grouped.get(s.project)!.push(s);
  }

  if (loading) return <p style={{ color: "#71717a" }}>Loading sessions...</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ color: "#71717a", fontSize: 13 }}>
          {sessions.length} sessions · {selected.size} selected
        </span>
        <button
          onClick={distill}
          disabled={selected.size === 0 || distilling}
          style={{
            background: selected.size > 0 ? "#2563eb" : "#27272a",
            color: selected.size > 0 ? "#fff" : "#52525b",
            border: "none",
            borderRadius: 6,
            padding: "8px 20px",
            cursor: selected.size > 0 ? "pointer" : "default",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          {distilling ? "Distilling..." : "Distill"}
        </button>
      </div>

      {[...grouped.entries()].map(([project, items]) => (
        <div key={project} style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, color: "#71717a", marginBottom: 8, fontWeight: 400 }}>
            {project}
          </h3>
          {items.map((s) => (
            <label
              key={s.path}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: 6,
                background: selected.has(s.path) ? "#1e293b" : "transparent",
                cursor: "pointer",
                fontSize: 13,
                marginBottom: 2,
              }}
            >
              <input
                type="checkbox"
                checked={selected.has(s.path)}
                onChange={() => toggle(s.path)}
                style={{ accentColor: "#2563eb" }}
              />
              <span style={{ color: "#a1a1aa", width: 130, flexShrink: 0 }}>
                {s.modified.slice(0, 16).replace("T", " ")}
              </span>
              <span style={{ color: "#71717a", width: 50, flexShrink: 0, textAlign: "right" }}>
                {s.sizeKB}KB
              </span>
              <span style={{ color: "#d4d4d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {s.sessionId}
              </span>
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}
