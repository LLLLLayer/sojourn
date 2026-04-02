import React from "react";
import { ThoughtTreeView } from "../components/ThoughtTreeView.js";
import { SOPView } from "../components/SOPView.js";
import { WorkflowView } from "../components/WorkflowView.js";

export function ResultView({ result, onBack }: { result: any; onBack: () => void }) {
  return (
    <div>
      <button onClick={onBack} className="anim-in" style={{
        background: "none", border: "none", color: "var(--text-tertiary)", fontSize: 12, fontFamily: "var(--font-mono)", cursor: "pointer", padding: 0, marginBottom: 20, transition: "color 0.15s ease",
      }} onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "var(--text-secondary)"; }} onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--text-tertiary)"; }}>
        ← back
      </button>
      <div style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-l)", border: "1px solid var(--border-hairline)", padding: "28px 32px", boxShadow: "var(--shadow-sm)" }}>
        {result.type === "thought_tree" && <ThoughtTreeView result={result} />}
        {result.type === "sop" && <SOPView result={result} />}
        {result.type === "workflow" && <WorkflowView result={result} />}
        {!["thought_tree", "sop", "workflow"].includes(result.type) && <pre style={{ fontSize: 11, color: "var(--text-secondary)", overflow: "auto" }}>{JSON.stringify(result, null, 2)}</pre>}
      </div>
    </div>
  );
}
