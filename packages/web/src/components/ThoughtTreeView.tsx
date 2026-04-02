import React from "react";

interface TreeNode { id: string; parentId: string | null; nodeType: string; label: string; reason?: string; confidence?: number; }

const STYLES: Record<string, { color: string; bg: string }> = {
  question:       { color: "var(--accent)",  bg: "var(--accent-bg)" },
  hypothesis:     { color: "var(--blue)",    bg: "var(--blue-bg)" },
  investigation:  { color: "var(--purple)",  bg: "var(--purple-bg)" },
  evidence:       { color: "#2e7d9a",        bg: "#ebf5f8" },
  pruning:        { color: "var(--red)",     bg: "var(--red-bg)" },
  convergence:    { color: "var(--green)",   bg: "var(--green-bg)" },
  subproblem:     { color: "var(--accent)",  bg: "var(--accent-bg)" },
  implementation: { color: "var(--green)",   bg: "var(--green-bg)" },
};

export function ThoughtTreeView({ result }: { result: any }) {
  const nodes: TreeNode[] = result.nodes ?? [];
  const childMap = new Map<string | null, TreeNode[]>();
  for (const n of nodes) { const k = n.parentId; if (!childMap.has(k)) childMap.set(k, []); childMap.get(k)!.push(n); }

  return (
    <div className="anim-up">
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Thought Tree</div>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 400, lineHeight: 1.3 }}>{result.rootQuestion}</h2>
        {result.summary && <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--text-secondary)", fontSize: 14, marginTop: 6 }}>{result.summary}</p>}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid var(--border-hairline)" }}>
        {Object.entries(STYLES).map(([type, s]) => (
          <span key={type} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}>
            <span style={{ width: 6, height: 6, borderRadius: 2, background: s.color }} />
            <span style={{ color: "var(--text-tertiary)" }}>{type}</span>
          </span>
        ))}
      </div>

      <div className="tree-root" style={{ fontSize: 12 }}>
        <Branch childMap={childMap} parentId={null} depth={0} idx={0} />
      </div>
    </div>
  );
}

function Branch({ childMap, parentId, depth, idx }: { childMap: Map<string | null, TreeNode[]>; parentId: string | null; depth: number; idx: number }) {
  const children = childMap.get(parentId) ?? [];
  return <>{children.map((node, i) => {
    const s = STYLES[node.nodeType] ?? { color: "var(--text-secondary)", bg: "var(--bg-subtle)" };
    return (
      <div key={node.id} className={`tree-node anim-slide d${((idx + i) % 6) + 1}`} style={{ marginLeft: depth * 24, marginBottom: 5, paddingLeft: depth > 0 ? 18 : 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 10px", borderRadius: "var(--radius-s)", background: s.bg, transition: "box-shadow 0.15s ease" }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = "var(--shadow-xs)"}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}>
          <span style={{ fontSize: 10, fontWeight: 500, color: s.color, background: "rgba(255,255,255,0.7)", padding: "1px 6px", borderRadius: 4, flexShrink: 0, marginTop: 1 }}>{node.nodeType}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ color: "var(--text-primary)", lineHeight: 1.5 }}>{node.label}</span>
            {node.confidence != null && node.confidence < 1 && <span style={{ color: "var(--text-tertiary)", fontSize: 10, marginLeft: 4 }}>{Math.round(node.confidence * 100)}%</span>}
            {node.reason && <div style={{ marginTop: 4, paddingTop: 4, borderTop: "1px solid rgba(0,0,0,0.04)", color: node.nodeType === "pruning" ? "var(--red)" : "var(--green)", fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, lineHeight: 1.5 }}>{node.reason}</div>}
          </div>
        </div>
        <Branch childMap={childMap} parentId={node.id} depth={depth + 1} idx={idx + i + 1} />
      </div>
    );
  })}</>;
}
