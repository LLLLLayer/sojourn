import React, { useEffect, useState } from "react";

interface PendingItem {
  id: string;
  resultType: string;
  status: string;
  createdAt: string;
  sessionIds: string[];
}

export function PendingList() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/distill/pending")
      .then((r) => r.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      });
  };

  useEffect(load, []);

  const commit = async (id: string) => {
    await fetch(`/api/distill/${id}/commit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sink: "claude-md", outputPath: "./CLAUDE.md" }),
    });
    load();
  };

  const discard = async (id: string) => {
    await fetch(`/api/distill/${id}`, { method: "DELETE" });
    load();
  };

  if (loading) return <p style={{ color: "#71717a" }}>Loading...</p>;
  if (items.length === 0) return <p style={{ color: "#71717a" }}>No pending results.</p>;

  return (
    <div>
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 12px",
            borderRadius: 6,
            background: "#18181b",
            border: "1px solid #27272a",
            marginBottom: 8,
            fontSize: 13,
          }}
        >
          <StatusBadge status={item.status} />
          <span style={{ color: "#a1a1aa", width: 100 }}>{item.resultType}</span>
          <span style={{ color: "#71717a", width: 130 }}>
            {item.createdAt.slice(0, 16).replace("T", " ")}
          </span>
          <span style={{ color: "#52525b", flex: 1 }}>{item.id}</span>

          {item.status === "pending" && (
            <div style={{ display: "flex", gap: 6 }}>
              <SmallButton color="#2563eb" onClick={() => commit(item.id)}>
                Commit
              </SmallButton>
              <SmallButton color="#dc2626" onClick={() => discard(item.id)}>
                Discard
              </SmallButton>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "#eab308",
    editing: "#3b82f6",
    committed: "#22c55e",
    discarded: "#71717a",
  };
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: colors[status] ?? "#71717a",
        flexShrink: 0,
      }}
    />
  );
}

function SmallButton({
  color,
  onClick,
  children,
}: {
  color: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        color,
        border: `1px solid ${color}`,
        borderRadius: 4,
        padding: "3px 10px",
        cursor: "pointer",
        fontSize: 12,
      }}
    >
      {children}
    </button>
  );
}
