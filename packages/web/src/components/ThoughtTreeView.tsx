import React from "react";

interface TreeNode {
  id: string;
  parentId: string | null;
  nodeType: string;
  label: string;
  reason?: string;
  confidence?: number;
}

const NODE_COLORS: Record<string, string> = {
  question: "#eab308",
  hypothesis: "#3b82f6",
  investigation: "#8b5cf6",
  evidence: "#06b6d4",
  pruning: "#ef4444",
  convergence: "#22c55e",
  subproblem: "#f59e0b",
  implementation: "#10b981",
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
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
        {result.rootQuestion}
      </h2>
      {result.summary && (
        <p style={{ color: "#71717a", fontSize: 13, marginBottom: 20 }}>
          {result.summary}
        </p>
      )}
      <div style={{ fontFamily: "monospace", fontSize: 13 }}>
        <TreeBranch childMap={childMap} parentId={null} depth={0} />
      </div>
    </div>
  );
}

function TreeBranch({
  childMap,
  parentId,
  depth,
}: {
  childMap: Map<string | null, TreeNode[]>;
  parentId: string | null;
  depth: number;
}) {
  const children = childMap.get(parentId) ?? [];

  return (
    <>
      {children.map((node, i) => (
        <div key={node.id} style={{ marginLeft: depth * 24, marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span
              style={{
                display: "inline-block",
                padding: "1px 6px",
                borderRadius: 3,
                fontSize: 11,
                fontWeight: 500,
                background: NODE_COLORS[node.nodeType] ?? "#52525b",
                color: "#000",
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              {node.nodeType}
            </span>
            <span style={{ color: "#e5e5e5" }}>{node.label}</span>
            {node.confidence != null && node.confidence < 1 && (
              <span style={{ color: "#52525b", fontSize: 11 }}>
                ({Math.round(node.confidence * 100)}%)
              </span>
            )}
          </div>
          {node.reason && (
            <div
              style={{
                marginLeft: 24,
                color: node.nodeType === "pruning" ? "#fca5a5" : "#86efac",
                fontSize: 12,
                fontStyle: "italic",
              }}
            >
              {node.reason}
            </div>
          )}
          <TreeBranch childMap={childMap} parentId={node.id} depth={depth + 1} />
        </div>
      ))}
    </>
  );
}
