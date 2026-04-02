import React, { useEffect, useState } from "react";
import { t } from "../i18n.js";
import { ThoughtTreeView } from "../components/ThoughtTreeView.js";
import { SOPView } from "../components/SOPView.js";
import { WorkflowView } from "../components/WorkflowView.js";

interface PendingItem {
  id: string;
  resultType: string;
  resultData: any;
  status: string;
  createdAt: string;
  sessionIds: string[];
  committedTo: string | null;
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
    setSelectedId(null);
    load();
  };

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ color: "var(--text-muted)", fontFamily: "var(--font-display)", fontStyle: "italic" }}>
        Loading...
      </div>
    );
  }

  const selected = items.find((i) => i.id === selectedId);

  // Detail view
  if (selected) {
    return (
      <div className="animate-fade-up">
        <button
          onClick={() => setSelectedId(null)}
          style={{
            background: "transparent",
            color: "var(--text-muted)",
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            fontFamily: "var(--font-mono)",
            marginBottom: 24,
            padding: 0,
            letterSpacing: "0.04em",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "var(--text-warm)"; }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--text-muted)"; }}
        >
          {t("pending.backToList")}
        </button>

        {/* Meta info */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
          fontSize: 11,
          fontFamily: "var(--font-mono)",
          color: "var(--text-muted)",
        }}>
          <span style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: (STATUS_STYLES[selected.status] ?? STATUS_STYLES.pending).color,
          }} />
          <span>{selected.status}</span>
          <span style={{ color: "var(--border-default)" }}>|</span>
          <span>{selected.id}</span>
          <span style={{ color: "var(--border-default)" }}>|</span>
          <span>{selected.createdAt.slice(0, 16).replace("T", " ")}</span>
          {selected.committedTo && (
            <>
              <span style={{ color: "var(--border-default)" }}>|</span>
              <span>committed to {selected.committedTo}</span>
            </>
          )}
        </div>

        {/* Actions */}
        {selected.status === "pending" && (
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            <ActionButton color="var(--accent-sage)" onClick={() => commit(selected.id)}>
              {t("pending.commitTo")}
            </ActionButton>
            <ActionButton color="var(--accent-terracotta)" onClick={() => discard(selected.id)}>
              {t("pending.discard")}
            </ActionButton>
          </div>
        )}

        {/* Result visualization */}
        <div style={{
          background: "var(--bg-elevated)",
          borderRadius: "var(--radius-xl)",
          border: "none",
          padding: "32px 36px",
          boxShadow: "var(--shadow-card)",
        }}>
          {selected.resultData?.type === "thought_tree" && (
            <ThoughtTreeView result={selected.resultData} />
          )}
          {selected.resultData?.type === "sop" && (
            <SOPView result={selected.resultData} />
          )}
          {selected.resultData?.type === "workflow" && (
            <WorkflowView result={selected.resultData} />
          )}
          {!["thought_tree", "sop", "workflow"].includes(selected.resultData?.type) && (
            <pre style={{
              fontSize: 11,
              color: "var(--text-secondary)",
              overflow: "auto",
              fontFamily: "var(--font-mono)",
              lineHeight: 1.6,
            }}>
              {JSON.stringify(selected.resultData, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  }

  // List view
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
          {t("pending.title")}
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4, fontFamily: "var(--font-mono)" }}>
          {t("pending.awaiting", items.filter((i) => i.status === "pending").length, items.length)}
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
          {t("pending.empty")}
        </div>
      ) : (
        <div>
          {items.map((item, i) => {
            const status = STATUS_STYLES[item.status] ?? STATUS_STYLES.pending;
            return (
              <div
                key={item.id}
                className={`animate-fade-up stagger-${Math.min(i + 1, 8)}`}
                onClick={() => setSelectedId(item.id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "10px 90px 1fr 140px auto",
                  alignItems: "center",
                  gap: 16,
                  padding: "14px 18px",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--bg-elevated)",
                  border: "none",
                  marginBottom: 6,
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-hover)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLElement).style.transform = "none";
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

                <span style={{ color: "var(--text-muted)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {getTitle(item)}
                </span>

                <span style={{ color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                  {item.createdAt.slice(0, 16).replace("T", " ")}
                </span>

                {item.status === "pending" ? (
                  <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
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

function getTitle(item: PendingItem): string {
  const data = item.resultData;
  if (!data) return item.id;
  if (data.type === "sop") return data.title ?? item.id;
  if (data.type === "thought_tree") return data.rootQuestion ?? item.id;
  if (data.type === "workflow") return data.patternName ?? item.id;
  return item.id;
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
