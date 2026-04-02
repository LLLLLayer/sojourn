import React, { useEffect, useState } from "react";
import { ThoughtTreeView } from "../components/ThoughtTreeView.js";
import { SOPView } from "../components/SOPView.js";
import { WorkflowView } from "../components/WorkflowView.js";

interface PendingItem { id: string; resultType: string; resultData: any; status: string; createdAt: string; sessionIds: string[]; committedTo: string | null; }

const STATUS: Record<string, { color: string; label: string }> = {
  pending: { color: "var(--accent)", label: "pending" },
  editing: { color: "var(--blue)", label: "editing" },
  committed: { color: "var(--green)", label: "committed" },
  discarded: { color: "var(--text-tertiary)", label: "discarded" },
};

export function PendingList() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = () => { fetch("/api/distill/pending").then((r) => r.json()).then((d) => { setItems(d); setLoading(false); }); };
  useEffect(load, []);

  const commit = async (id: string) => {
    await fetch(`/api/distill/${id}/commit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sink: "claude-md", outputPath: "./CLAUDE.md" }) });
    load();
  };
  const discard = async (id: string) => { await fetch(`/api/distill/${id}`, { method: "DELETE" }); setSelectedId(null); load(); };

  if (loading) return <div className="anim-in" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>Loading...</div>;

  const selected = items.find((i) => i.id === selectedId);

  if (selected) {
    return (
      <div className="anim-up">
        <button onClick={() => setSelectedId(null)} style={{ background: "none", border: "none", color: "var(--text-tertiary)", fontSize: 12, fontFamily: "var(--font-mono)", cursor: "pointer", padding: 0, marginBottom: 20 }}>← back</button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, fontSize: 11, color: "var(--text-tertiary)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: (STATUS[selected.status] ?? STATUS.pending).color }} />
          <span>{selected.status}</span>
          <span style={{ opacity: 0.3 }}>·</span>
          <span>{selected.createdAt.slice(0, 16).replace("T", " ")}</span>
        </div>
        {selected.status === "pending" && (
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            <Btn color="var(--green)" onClick={() => commit(selected.id)}>Commit to CLAUDE.md</Btn>
            <Btn color="var(--red)" onClick={() => discard(selected.id)}>Discard</Btn>
          </div>
        )}
        <div style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-l)", border: "1px solid var(--border-hairline)", padding: "28px 32px", boxShadow: "var(--shadow-sm)" }}>
          {selected.resultData?.type === "thought_tree" && <ThoughtTreeView result={selected.resultData} />}
          {selected.resultData?.type === "sop" && <SOPView result={selected.resultData} />}
          {selected.resultData?.type === "workflow" && <WorkflowView result={selected.resultData} />}
        </div>
      </div>
    );
  }

  return (
    <div className="anim-up">
      <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 26, fontWeight: 400, marginBottom: 4 }}>Pending</h2>
      <p style={{ color: "var(--text-tertiary)", fontSize: 12, marginBottom: 24 }}>{items.filter((i) => i.status === "pending").length} awaiting review · {items.length} total</p>

      {items.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-tertiary)", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>No pending results</div>
      ) : items.map((item, i) => {
        const st = STATUS[item.status] ?? STATUS.pending;
        const title = item.resultData?.title || item.resultData?.rootQuestion || item.resultData?.patternName || item.id;
        return (
          <div key={item.id} className={`anim-up d${(i % 6) + 1}`} onClick={() => setSelectedId(item.id)} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: "var(--radius-s)",
            background: "var(--bg-surface)", border: "1px solid var(--border-hairline)", marginBottom: 4, fontSize: 12, cursor: "pointer", transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-light)"; e.currentTarget.style.boxShadow = "var(--shadow-xs)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-hairline)"; e.currentTarget.style.boxShadow = "none"; }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.color, flexShrink: 0 }} />
            <span style={{ color: "var(--text-secondary)", width: 80 }}>{item.resultType}</span>
            <span style={{ color: "var(--text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
            <span style={{ color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{item.createdAt.slice(0, 10)}</span>
            {item.status === "pending" && (
              <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
                <Btn color="var(--green)" onClick={() => commit(item.id)}>commit</Btn>
                <Btn color="var(--red)" onClick={() => discard(item.id)}>discard</Btn>
              </div>
            )}
            {item.status !== "pending" && <span style={{ color: st.color, fontSize: 10, letterSpacing: "0.04em" }}>{st.label}</span>}
          </div>
        );
      })}
    </div>
  );
}

function Btn({ color, onClick, children }: { color: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      background: "transparent", color, border: `1px solid ${color}30`, borderRadius: "var(--radius-s)", padding: "3px 10px",
      cursor: "pointer", fontSize: 11, fontFamily: "var(--font-mono)", transition: "all 0.15s ease",
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = `${color}08`; e.currentTarget.style.borderColor = `${color}60`; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = `${color}30`; }}>
      {children}
    </button>
  );
}
