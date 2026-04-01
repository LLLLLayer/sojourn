import React from "react";
import { ThoughtTreeView } from "../components/ThoughtTreeView.js";
import { SOPView } from "../components/SOPView.js";

export function ResultView({
  result,
  onBack,
}: {
  result: any;
  onBack: () => void;
}) {
  return (
    <div>
      <button
        onClick={onBack}
        className="animate-fade-in"
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
        onMouseEnter={(e) => {
          (e.target as HTMLElement).style.color = "var(--text-warm)";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLElement).style.color = "var(--text-muted)";
        }}
      >
        &larr; back to sessions
      </button>

      <div
        style={{
          background: "var(--bg-surface)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-subtle)",
          padding: "32px 36px",
        }}
      >
        {result.type === "thought_tree" && <ThoughtTreeView result={result} />}
        {result.type === "sop" && <SOPView result={result} />}
        {result.type !== "thought_tree" && result.type !== "sop" && (
          <pre
            style={{
              fontSize: 11,
              color: "var(--text-secondary)",
              overflow: "auto",
              fontFamily: "var(--font-mono)",
              lineHeight: 1.6,
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
