import React from "react";

export function Section({ title, description, children }: {
  title: string; description: string; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid var(--border-hairline)" }}>
      <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 500, color: "var(--text-primary)", marginBottom: 4 }}>{title}</h3>
      <p style={{ fontSize: 12, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", marginBottom: 14 }}>{description}</p>
      {children}
    </div>
  );
}

export function OptionButton({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} style={{
      background: active ? "var(--bg-active)" : "var(--bg-surface)",
      color: active ? "var(--text-accent)" : "var(--text-secondary)",
      border: active ? "1px solid var(--accent-light)" : "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-s)", padding: "6px 16px", fontSize: 12,
      fontFamily: "var(--font-mono)", cursor: "pointer", transition: "all 0.2s ease",
    }}>
      {children}
    </button>
  );
}

export function ActionButton({ color, onClick, children }: {
  color: string; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} style={{
      background: "transparent", color, border: `1px solid ${color}40`,
      borderRadius: "var(--radius-s)", padding: "3px 10px", cursor: "pointer",
      fontSize: 11, fontFamily: "var(--font-mono)", transition: "all 0.2s ease",
    }}
    onMouseEnter={(e) => { (e.target as HTMLElement).style.borderColor = color; }}
    onMouseLeave={(e) => { (e.target as HTMLElement).style.borderColor = `${color}40`; }}>
      {children}
    </button>
  );
}

export const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", background: "var(--bg-surface)",
  border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-s)",
  color: "var(--text-primary)", fontSize: 12, fontFamily: "var(--font-mono)", outline: "none",
};
