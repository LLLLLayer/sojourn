import React from "react";

interface Step {
  description: string;
  failureBranch?: string;
  precondition?: string;
}

export function SOPView({ result }: { result: any }) {
  const steps: Step[] = result.steps ?? [];

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
        {result.title}
      </h2>
      {result.summary && (
        <p style={{ color: "#71717a", fontSize: 13, marginBottom: 20 }}>
          {result.summary}
        </p>
      )}

      <ol style={{ listStyle: "none", padding: 0, counterReset: "step" }}>
        {steps.map((step, i) => (
          <li
            key={i}
            style={{
              padding: "12px 16px",
              borderRadius: 6,
              background: "#1e1e21",
              border: "1px solid #27272a",
              marginBottom: 8,
              fontSize: 13,
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  borderRadius: "50%",
                  width: 22,
                  height: 22,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {i + 1}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#e5e5e5", lineHeight: 1.5 }}>
                  {step.description}
                </div>
                {step.precondition && (
                  <div style={{ color: "#eab308", fontSize: 12, marginTop: 6 }}>
                    前置条件: {step.precondition}
                  </div>
                )}
                {step.failureBranch && (
                  <div style={{ color: "#f87171", fontSize: 12, marginTop: 4 }}>
                    失败处理: {step.failureBranch}
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
