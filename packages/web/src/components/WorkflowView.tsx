import React from "react";


export function WorkflowView({ result }: { result: any }) {
  const evidence: string[] = result.evidence ?? [];

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{
            fontSize: 10,
            fontFamily: "var(--font-mono)",
            color: "var(--accent-lavender)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}>
            Workflow Pattern
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
          {result.patternName}
        </h2>
      </div>

      {/* Trigger & Recommendation */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        <div style={{
          padding: "20px 24px",
          borderRadius: "var(--radius-md)",
          background: "#fdf6e8",
          border: "1px solid #eedcaa",
        }}>
          <div style={{
            fontSize: 10,
            fontFamily: "var(--font-mono)",
            color: "var(--accent-amber)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 10,
            fontWeight: 500,
          }}>
            When
          </div>
          <div style={{
            fontFamily: "var(--font-display)",
            fontSize: 15,
            color: "var(--text-primary)",
            lineHeight: 1.6,
          }}>
            {result.trigger}
          </div>
        </div>

        <div style={{
          padding: "20px 24px",
          borderRadius: "var(--radius-md)",
          background: "#edf7f0",
          border: "1px solid #bddcc6",
        }}>
          <div style={{
            fontSize: 10,
            fontFamily: "var(--font-mono)",
            color: "var(--accent-sage)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 10,
            fontWeight: 500,
          }}>
            Do
          </div>
          <div style={{
            fontFamily: "var(--font-display)",
            fontSize: 15,
            color: "var(--text-primary)",
            lineHeight: 1.6,
          }}>
            {result.recommendation}
          </div>
        </div>
      </div>

      {/* Evidence */}
      {evidence.length > 0 && (
        <div>
          <div style={{
            fontSize: 10,
            fontFamily: "var(--font-mono)",
            color: "var(--text-muted)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}>
            {`Evidence from ${result.sessionIds?.length ?? 0} sessions`}
          </div>
          {evidence.map((e, i) => (
            <div
              key={i}
              className={`animate-fade-up stagger-${Math.min(i + 1, 8)}`}
              style={{
                display: "flex",
                gap: 12,
                padding: "12px 16px",
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                marginBottom: 4,
                fontSize: 13,
                fontFamily: "var(--font-mono)",
                fontWeight: 300,
                lineHeight: 1.6,
                color: "var(--text-secondary)",
              }}
            >
              <span style={{
                color: "var(--accent-lavender)",
                fontWeight: 500,
                flexShrink: 0,
                fontSize: 11,
                marginTop: 2,
              }}>
                S{i + 1}
              </span>
              <span>{e}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
