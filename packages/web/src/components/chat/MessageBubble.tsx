import React, { useState } from "react";
import type { MessageItem } from "../../types.js";

export function MessageBubble({ message }: { message: MessageItem }) {
  const [expanded, setExpanded] = useState(false);
  const isUser = message.role === "user";
  const isSystem = message.role === "system" || message.role === "result";

  if (isSystem && !message.content.trim()) return null;
  if (!isUser && !isSystem && !message.content.trim() && !message.toolUses?.length) return null;

  const content = message.content || "";
  const isLong = content.length > 500;
  const displayContent = isLong && !expanded ? content.slice(0, 500) : content;
  const hasTools = message.toolUses?.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", marginBottom: 8 }}>
      <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-tertiary)", marginBottom: 3, paddingLeft: isUser ? 0 : 2, paddingRight: isUser ? 2 : 0, letterSpacing: "0.04em" }}>
        {isUser ? "YOU" : isSystem ? "SYSTEM" : "ASSISTANT"}
        {message.timestamp && <span style={{ marginLeft: 8, opacity: 0.6 }}>{new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
      </div>
      <div style={{
        maxWidth: isUser ? "82%" : "92%",
        background: isUser ? "var(--accent)" : "var(--bg-subtle)",
        color: isUser ? "#fff" : "var(--text-primary)",
        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        padding: content ? "10px 14px" : "6px 14px", position: "relative",
      }}>
        {content && (
          <div style={{ fontSize: 13, fontFamily: isUser ? "var(--font-mono)" : "var(--font-serif)", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {isUser ? displayContent : renderContent(displayContent)}
          </div>
        )}
        {isLong && (
          <button onClick={() => setExpanded(!expanded)} style={{ background: "none", border: "none", color: isUser ? "rgba(255,255,255,0.6)" : "var(--accent)", fontSize: 11, fontFamily: "var(--font-mono)", cursor: "pointer", padding: "4px 0 0" }}>
            {expanded ? "← less" : "more →"}
          </button>
        )}
        {hasTools && <div style={{ marginTop: content ? 6 : 0 }}>{message.toolUses.map((tool, i) => <ToolBadge key={i} tool={tool} isUser={isUser} />)}</div>}
        {message.isSidechain && <div style={{ position: "absolute", top: -3, right: isUser ? undefined : -3, left: isUser ? -3 : undefined, width: 8, height: 8, borderRadius: "50%", background: "var(--purple)", border: "2px solid var(--bg-surface)" }} title="Side branch" />}
      </div>
    </div>
  );
}

function renderContent(text: string): React.ReactNode {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```")) {
      const lines = part.split("\n");
      const lang = lines[0].replace("```", "").trim();
      const code = lines.slice(1, -1).join("\n");
      return (
        <pre key={i} style={{ background: "rgba(0,0,0,0.04)", borderRadius: 8, padding: "8px 10px", margin: "6px 0", fontSize: 11, fontFamily: "var(--font-mono)", overflowX: "auto", lineHeight: 1.5 }}>
          {lang && <span style={{ fontSize: 9, color: "var(--text-tertiary)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{lang}</span>}
          {code}
        </pre>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function ToolBadge({ tool, isUser }: { tool: { name: string; input: Record<string, unknown>; output?: string }; isUser: boolean }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ background: isUser ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.03)", borderRadius: 8, padding: "5px 10px", marginBottom: 3, borderLeft: `2px solid ${isUser ? "rgba(255,255,255,0.25)" : "var(--green)"}`, cursor: tool.output ? "pointer" : "default" }}
      onClick={() => tool.output && setExpanded(!expanded)}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 500, color: isUser ? "rgba(255,255,255,0.8)" : "var(--green)" }}>
        {tool.name}
        {tool.output && <span style={{ opacity: 0.4, fontSize: 9 }}>{expanded ? "▼" : "▶"}</span>}
      </div>
      {expanded && tool.output && <pre style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 300, marginTop: 4, color: isUser ? "rgba(255,255,255,0.6)" : "var(--text-secondary)", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 180, overflow: "auto" }}>{tool.output}</pre>}
      {!expanded && tool.output && <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 300, color: isUser ? "rgba(255,255,255,0.4)" : "var(--text-tertiary)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tool.output.slice(0, 80)}</div>}
    </div>
  );
}
