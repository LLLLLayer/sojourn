import React from "react";


interface Step {
  description: string;
  failureBranch?: string;
  precondition?: string;
}

export function SOPView({ result }: { result: any }) {
  const steps: Step[] = result.steps ?? [];

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{
            fontSize: 10,
            fontFamily: "var(--font-mono)",
            color: "var(--accent-sage-dim)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}>
            Standard Operating Procedure
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
          {result.title}
        </h2>
        {result.summary && (
          <p style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            color: "var(--text-muted)",
            fontSize: 14,
            marginTop: 8,
          }}>
            {result.summary}
          </p>
        )}
      </div>

      <ol style={{ listStyle: "none", padding: 0 }}>
        {steps.map((step, i) => (
          <li
            key={i}
            className={`animate-fade-up stagger-${Math.min(i + 1, 8)}`}
            style={{
              display: "grid",
              gridTemplateColumns: "40px 1fr",
              gap: 16,
              marginBottom: 2,
              padding: "16px 20px",
              borderRadius: "var(--radius-lg)",
              background: "var(--bg-elevated)",
              border: "none",
              transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            {/* Step Number */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: 2,
            }}>
              <span style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                fontWeight: 300,
                color: "var(--accent-amber-dim)",
                lineHeight: 1,
              }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              {i < steps.length - 1 && (
                <span style={{
                  width: 1,
                  flex: 1,
                  marginTop: 8,
                  background: "var(--border-subtle)",
                }} />
              )}
            </div>

            {/* Step Content */}
            <div>
              <div style={{
                color: "var(--text-primary)",
                fontSize: 13,
                lineHeight: 1.6,
                fontFamily: "var(--font-mono)",
                fontWeight: 300,
              }}>
                {step.description}
              </div>

              {step.precondition && (
                <div style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  marginTop: 10,
                  padding: "8px 12px",
                  borderRadius: "var(--radius-md)",
                  background: "#fdf6e8",
                  border: "none",
                }}>
                  <span style={{ color: "var(--accent-ochre)", fontSize: 11, flexShrink: 0, fontWeight: 500 }}>
                    PRE
                  </span>
                  <span style={{
                    color: "var(--accent-ochre)",
                    fontSize: 11,
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                  }}>
                    {step.precondition}
                  </span>
                </div>
              )}

              {step.failureBranch && (
                <div style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  marginTop: 6,
                  padding: "8px 12px",
                  borderRadius: "var(--radius-md)",
                  background: "#fdf0ed",
                  border: "none",
                }}>
                  <span style={{ color: "var(--accent-terracotta)", fontSize: 11, flexShrink: 0, fontWeight: 500 }}>
                    FAIL
                  </span>
                  <span style={{
                    color: "var(--accent-terracotta)",
                    fontSize: 11,
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                  }}>
                    {step.failureBranch}
                  </span>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
