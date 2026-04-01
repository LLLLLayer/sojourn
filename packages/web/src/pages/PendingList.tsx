import React, { useEffect, useState } from "react";

interface PendingItem {
  id: string;
  resultType: string;
  status: string;
  createdAt: string;
  sessionIds: string[];
}

const STATUS_STYLES: Record<string, { color: string; label: string }> = {
  pending:   { color: "var(--accent-amber)",     label: "pending" },
  editing:   { color: "var(--accent-sky)",       label: "editing" },
  committed: { color: "var(--accent-sage)",      label: "committed" },
  discarded: { color: "var(--text-muted)",       label: "discarded" },
};

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

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ color: "var(--text-muted)", fontFamily: "var(--font-display)", fontStyle: "italic" }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: 32 }}>
        <h2 style={{
          fontFamily: "var(--font-display)",
          fontSize: 28,
          fontWeight: 400,
          color: "var(--text-primary)",
          letterSpacing: "-0.03em",
        }}>
          Pending
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4, fontFamily: "var(--font-mono)" }}>
          {items.filter((i) => i.status === "pending").length} awaiting review
        </p>
      </div>

      {items.length === 0 ? (
        <div style={{
          padding: "48px 0",
          textAlign: "center",
          color: "var(--text-muted)",
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontSize: 14,
        }}>
          No pending results
        </div>
      ) : (
        <div>
          {items.map((item, i) => {
            const status = STATUS_STYLES[item.status] ?? STATUS_STYLES.pending;
            return (
              <div
                key={item.id}
                className={`animate-fade-up stagger-${Math.min(i + 1, 8)}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "10px 90px 1fr 140px auto",
                  alignItems: "center",
                  gap: 16,
                  padding: "12px 16px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  marginBottom: 4,
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  transition: "border-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                }}
              >
                <span style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: status.color,
                  boxShadow: `0 0 6px ${status.color}40`,
                }} />

                <span style={{ color: "var(--text-secondary)" }}>{item.resultType}</span>

                <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{item.id}</span>

                <span style={{ color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                  {item.createdAt.slice(0, 16).replace("T", " ")}
                </span>

                {item.status === "pending" ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <ActionButton color="var(--accent-sage)" onClick={() => commit(item.id)}>
                      commit
                    </ActionButton>
                    <ActionButton color="var(--accent-terracotta)" onClick={() => discard(item.id)}>
                      discard
                    </ActionButton>
                  </div>
                ) : (
                  <span style={{ color: status.color, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {status.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActionButton({
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
        border: `1px solid ${color}40`,
        borderRadius: "var(--radius-sm)",
        padding: "4px 12px",
        cursor: "pointer",
        fontSize: 11,
        fontFamily: "var(--font-mono)",
        fontWeight: 400,
        letterSpacing: "0.04em",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        (e.target as HTMLElement).style.borderColor = color;
        (e.target as HTMLElement).style.background = `${color}10`;
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLElement).style.borderColor = `${color}40`;
        (e.target as HTMLElement).style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}
