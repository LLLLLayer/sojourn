import React from "react";

export function WorkflowView({ result }: { result: any }) {
  const evidence: string[] = result.evidence ?? [];
  return (
    <div className="anim-up">
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Workflow Pattern</div>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 400, lineHeight: 1.3 }}>{result.patternName}</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        <div style={{ padding: "16px 18px", borderRadius: "var(--radius-s)", background: "var(--accent-bg)" }}>
          <div style={{ fontSize: 10, fontWeight: 500, color: "var(--accent)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>When</div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--text-primary)", lineHeight: 1.6 }}>{result.trigger}</div>
        </div>
        <div style={{ padding: "16px 18px", borderRadius: "var(--radius-s)", background: "var(--green-bg)" }}>
          <div style={{ fontSize: 10, fontWeight: 500, color: "var(--green)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Do</div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--text-primary)", lineHeight: 1.6 }}>{result.recommendation}</div>
        </div>
      </div>

      {evidence.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Evidence from {result.sessionIds?.length ?? 0} sessions</div>
          {evidence.map((e, i) => (
            <div key={i} className={`anim-up d${(i % 6) + 1}`} style={{ padding: "10px 14px", borderRadius: "var(--radius-s)", background: "var(--bg-subtle)", marginBottom: 4, fontSize: 13, lineHeight: 1.6, color: "var(--text-secondary)" }}>
              {e}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
