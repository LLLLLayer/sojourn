import React from "react";


interface TreeNode {
  id: string;
  parentId: string | null;
  nodeType: string;
  label: string;
  reason?: string;
  confidence?: number;
}

const NODE_STYLES: Record<string, { bg: string; fg: string; border: string }> = {
  question:       { bg: "#fdf6e8", fg: "var(--accent-amber)",      border: "#eedcaa" },
  hypothesis:     { bg: "#eef4fa", fg: "var(--accent-sky)",        border: "#c4dbed" },
  investigation:  { bg: "#f2eefa", fg: "var(--accent-lavender)",   border: "#d4cbe8" },
  evidence:       { bg: "#ebf5f8", fg: "#2e7d9a",                  border: "#c0dfe8" },
  pruning:        { bg: "#fdf0ed", fg: "var(--accent-terracotta)", border: "#edc8c0" },
  convergence:    { bg: "#edf7f0", fg: "var(--accent-sage)",       border: "#bddcc6" },
  subproblem:     { bg: "#fdf6e8", fg: "var(--accent-ochre)",      border: "#eedcaa" },
  implementation: { bg: "#edf8f2", fg: "#2d8a5e",                  border: "#b8dcc8" },
};

export function ThoughtTreeView({ result }: { result: any }) {
  const nodes: TreeNode[] = result.nodes ?? [];

  const childMap = new Map<string | null, TreeNode[]>();
  for (const node of nodes) {
    const key = node.parentId;
    if (!childMap.has(key)) childMap.set(key, []);
    childMap.get(key)!.push(node);
  }

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{
            fontSize: 10,
            fontFamily: "var(--font-mono)",
            color: "var(--accent-amber-dim)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}>
            Thought Tree
          </span>
          <span style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
        </div>
        <h2 style={{
          fontFamily: "var(--font-display)",
          fontSize: 24,
          fontWeight: 400,
          color: "var(--text-primary)",
          letterSpacing: "-0.02em",
          lineHeight: 1.3,
        }}>
          {result.rootQuestion}
        </h2>
        {result.summary && (
          <p style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            color: "var(--text-muted)",
            fontSize: 14,
            marginTop: 8,
          }}>
            {result.summary}
          </p>
        )}
      </div>

      {/* Legend */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px 16px",
        marginBottom: 24,
        paddingBottom: 16,
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        {Object.entries(NODE_STYLES).map(([type, style]) => (
          <span key={type} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10 }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: style.fg,
              opacity: 0.8,
            }} />
            <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{type}</span>
          </span>
        ))}
      </div>

      {/* Tree */}
      <div className="tree-root" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
        <TreeBranch childMap={childMap} parentId={null} depth={0} index={0} />
      </div>
    </div>
  );
}

function TreeBranch({
  childMap,
  parentId,
  depth,
  index,
}: {
  childMap: Map<string | null, TreeNode[]>;
  parentId: string | null;
  depth: number;
  index: number;
}) {
  const children = childMap.get(parentId) ?? [];

  return (
    <>
      {children.map((node, i) => {
        const style = NODE_STYLES[node.nodeType] ?? { bg: "var(--bg-elevated)", fg: "var(--text-secondary)", border: "var(--border-default)" };
        const globalIndex = index + i;

        return (
          <div
            key={node.id}
            className={`tree-node animate-slide-in stagger-${Math.min(globalIndex + 1, 8)}`}
            style={{ marginLeft: depth * 28, marginBottom: 6, paddingLeft: depth > 0 ? 20 : 0 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                background: style.bg,
                border: `1px solid ${style.border}`,
                transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = style.fg;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = style.border;
              }}
            >
              <span style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: "var(--radius-sm)",
                fontSize: 10,
                fontWeight: 500,
                color: style.fg,
                background: "rgba(0,0,0,0.06)",
                flexShrink: 0,
                marginTop: 1,
                letterSpacing: "0.04em",
              }}>
                {node.nodeType}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ color: "var(--text-primary)", lineHeight: 1.5 }}>
                  {node.label}
                </span>
                {node.confidence != null && node.confidence < 1 && (
                  <span style={{ color: "var(--text-muted)", fontSize: 10, marginLeft: 6 }}>
                    {Math.round(node.confidence * 100)}%
                  </span>
                )}
                {node.reason && (
                  <div style={{
                    marginTop: 5,
                    paddingTop: 5,
                    borderTop: `1px dashed ${style.border}`,
                    color: node.nodeType === "pruning" ? "var(--accent-terracotta)" : "var(--accent-sage)",
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontSize: 12,
                    lineHeight: 1.5,
                  }}>
                    {node.reason}
                  </div>
                )}
              </div>
            </div>

            <TreeBranch
              childMap={childMap}
              parentId={node.id}
              depth={depth + 1}
              index={globalIndex + 1}
            />
          </div>
        );
      })}
    </>
  );
}
