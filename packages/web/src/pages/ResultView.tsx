import React from "react";
import { ThoughtTreeView } from "../components/ThoughtTreeView.js";
import { SOPView } from "../components/SOPView.js";

export function ResultView({ result, onBack }: { result: any; onBack: () => void }) {
  return (
    <div>
      <button
        onClick={onBack}
        style={{
          background: "transparent",
          color: "#71717a",
          border: "none",
          cursor: "pointer",
          fontSize: 13,
          marginBottom: 16,
          padding: 0,
        }}
      >
        ← Back to sessions
      </button>

      <div
        style={{
          background: "#18181b",
          borderRadius: 8,
          border: "1px solid #27272a",
          padding: 24,
        }}
      >
        {result.type === "thought_tree" && <ThoughtTreeView result={result} />}
        {result.type === "sop" && <SOPView result={result} />}
        {result.type !== "thought_tree" && result.type !== "sop" && (
          <pre style={{ fontSize: 12, color: "#a1a1aa", overflow: "auto" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
