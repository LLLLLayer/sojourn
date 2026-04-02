import React from "react";

interface Step { description: string; failureBranch?: string; precondition?: string; }

export function SOPView({ result }: { result: any }) {
  const steps: Step[] = result.steps ?? [];
  return (
    <div className="anim-up">
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Standard Operating Procedure</div>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 400, lineHeight: 1.3 }}>{result.title}</h2>
        {result.summary && <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--text-secondary)", fontSize: 14, marginTop: 6 }}>{result.summary}</p>}
      </div>

      <ol style={{ listStyle: "none", padding: 0 }}>
        {steps.map((step, i) => (
          <li key={i} className={`anim-up d${(i % 6) + 1}`} style={{
            display: "flex", gap: 14, marginBottom: 6, padding: "12px 14px",
            borderRadius: "var(--radius-s)", background: "var(--bg-subtle)", transition: "box-shadow 0.15s ease",
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = "var(--shadow-xs)"}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: 18, color: "var(--text-tertiary)", lineHeight: 1, paddingTop: 2, minWidth: 24 }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ color: "var(--text-primary)", fontSize: 13, lineHeight: 1.6 }}>{step.description}</div>
              {step.precondition && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 6, padding: "3px 8px", borderRadius: 4, background: "var(--accent-bg)", fontSize: 11, color: "var(--accent)" }}>
                  <span style={{ fontWeight: 500 }}>PRE</span> {step.precondition}
                </div>
              )}
              {step.failureBranch && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 4, padding: "3px 8px", borderRadius: 4, background: "var(--red-bg)", fontSize: 11, color: "var(--red)" }}>
                  <span style={{ fontWeight: 500 }}>FAIL</span> {step.failureBranch}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
