import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Message {
  id: string;
  role: string;
  content: string;
  toolUses: Array<{ name: string; input: Record<string, unknown>; output?: string }>;
  isSidechain: boolean;
  timestamp: string;
}

interface SessionDetail {
  sessionId: string;
  messageCount: number;
  isLinear: boolean;
  branchCount: number;
  messages: Message[];
}

export function ChatPreview({
  sessionId,
  onClose,
}: {
  sessionId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/sessions/${sessionId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [sessionId]);

  return createPortal(
    <div
      className="drawer-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        display: "flex",
        justifyContent: "flex-end",
        background: "rgba(0,0,0,0.18)",
        backdropFilter: "blur(2px)",
      }}
      onClick={onClose}
    >
      {/* Drawer Panel */}
      <div
        className="drawer-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(520px, 85vw)",
          height: "100vh",
          background: "var(--bg-surface)",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "18px 24px",
          borderBottom: "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 14,
              fontFamily: "var(--font-display)",
              color: "var(--text-primary)",
              fontWeight: 500,
            }}>
              Conversation
            </div>
            <div style={{
              fontSize: 11,
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {sessionId.slice(0, 12)}...
              {data && ` · ${data.messageCount} msgs · ${data.isLinear ? "linear" : data.branchCount + " branches"}`}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "var(--bg-elevated)",
              border: "none",
              borderRadius: "var(--radius-md)",
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--text-muted)",
              fontSize: 16,
              flexShrink: 0,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget).style.background = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { (e.currentTarget).style.background = "var(--bg-elevated)"; }}
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflow: "auto",
          padding: "16px 20px",
        }}>
          {loading ? (
            <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-display)", fontStyle: "italic", textAlign: "center", padding: 40 }}>
              Loading...
            </div>
          ) : error ? (
            <div style={{ color: "var(--accent-terracotta)", textAlign: "center", padding: 40, fontFamily: "var(--font-mono)", fontSize: 12 }}>
              {error}
            </div>
          ) : data?.messages.length === 0 ? (
            <div style={{ color: "var(--text-muted)", textAlign: "center", padding: 40 }}>
              Empty session
            </div>
          ) : (
            data?.messages.map((msg, i) => (
              <MessageBubble key={msg.id || i} message={msg} index={i} />
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function MessageBubble({ message, index }: { message: Message; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const isUser = message.role === "user";
  const isSystem = message.role === "system" || message.role === "result";

  // Skip empty system messages
  if (isSystem && !message.content.trim()) return null;
  // Skip empty assistant messages (streaming artifacts)
  if (!isUser && !isSystem && !message.content.trim() && !message.toolUses?.length) return null;

  const content = message.content || "";
  const isLong = content.length > 500;
  const displayContent = isLong && !expanded ? content.slice(0, 500) : content;
  const hasTools = message.toolUses?.length > 0;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: isUser ? "flex-end" : "flex-start",
      marginBottom: 8,
    }}>
      {/* Role label */}
      <div style={{
        fontSize: 10,
        fontFamily: "var(--font-mono)",
        color: "var(--text-muted)",
        marginBottom: 3,
        paddingLeft: isUser ? 0 : 2,
        paddingRight: isUser ? 2 : 0,
        letterSpacing: "0.04em",
      }}>
        {isUser ? "YOU" : isSystem ? "SYSTEM" : "ASSISTANT"}
        {message.timestamp && (
          <span style={{ marginLeft: 8, opacity: 0.6 }}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: isUser ? "82%" : "92%",
        background: isUser ? "var(--accent-amber)" : "var(--bg-elevated)",
        color: isUser ? "#fff" : "var(--text-primary)",
        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        padding: content ? "10px 14px" : "6px 14px",
        position: "relative",
      }}>
        {/* Content */}
        {content && (
          <div style={{
            fontSize: 13,
            fontFamily: isUser ? "var(--font-mono)" : "var(--font-display)",
            fontWeight: isUser ? 400 : 400,
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}>
            {renderContent(displayContent, isUser)}
          </div>
        )}

        {/* Show more/less */}
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: "none",
              border: "none",
              color: isUser ? "rgba(255,255,255,0.6)" : "var(--accent-amber)",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              cursor: "pointer",
              padding: "4px 0 0",
            }}
          >
            {expanded ? "← less" : "more →"}
          </button>
        )}

        {/* Tool calls */}
        {hasTools && (
          <div style={{ marginTop: content ? 6 : 0 }}>
            {message.toolUses.map((tool, ti) => (
              <ToolBadge key={ti} tool={tool} isUser={isUser} />
            ))}
          </div>
        )}

        {/* Sidechain dot */}
        {message.isSidechain && (
          <div
            style={{
              position: "absolute",
              top: -3,
              right: isUser ? undefined : -3,
              left: isUser ? -3 : undefined,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--accent-lavender)",
              border: "2px solid var(--bg-surface)",
            }}
            title="Side branch"
          />
        )}
      </div>
    </div>
  );
}

function renderContent(text: string, isUser: boolean): React.ReactNode {
  if (isUser) return text;

  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```")) {
      const lines = part.split("\n");
      const lang = lines[0].replace("```", "").trim();
      const code = lines.slice(1, -1).join("\n");
      return (
        <pre key={i} style={{
          background: "rgba(0,0,0,0.04)",
          borderRadius: 8,
          padding: "8px 10px",
          margin: "6px 0",
          fontSize: 11,
          fontFamily: "var(--font-mono)",
          fontWeight: 400,
          overflowX: "auto",
          lineHeight: 1.5,
        }}>
          {lang && (
            <span style={{ fontSize: 9, color: "var(--text-muted)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {lang}
            </span>
          )}
          {code}
        </pre>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function ToolBadge({ tool, isUser }: {
  tool: { name: string; input: Record<string, unknown>; output?: string };
  isUser: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        background: isUser ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.03)",
        borderRadius: 8,
        padding: "5px 10px",
        marginBottom: 3,
        borderLeft: `2px solid ${isUser ? "rgba(255,255,255,0.25)" : "var(--accent-sage-dim)"}`,
        cursor: tool.output ? "pointer" : "default",
      }}
      onClick={() => tool.output && setExpanded(!expanded)}
    >
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        fontFamily: "var(--font-mono)",
        fontWeight: 500,
        color: isUser ? "rgba(255,255,255,0.8)" : "var(--accent-sage)",
      }}>
        {tool.name}
        {tool.output && (
          <span style={{ opacity: 0.4, fontSize: 9 }}>{expanded ? "▼" : "▶"}</span>
        )}
      </div>

      {expanded && tool.output && (
        <pre style={{
          fontSize: 10,
          fontFamily: "var(--font-mono)",
          fontWeight: 300,
          marginTop: 4,
          color: isUser ? "rgba(255,255,255,0.6)" : "var(--text-secondary)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          maxHeight: 180,
          overflow: "auto",
        }}>
          {tool.output}
        </pre>
      )}

      {!expanded && tool.output && (
        <div style={{
          fontSize: 10,
          fontFamily: "var(--font-mono)",
          fontWeight: 300,
          color: isUser ? "rgba(255,255,255,0.4)" : "var(--text-muted)",
          marginTop: 2,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {tool.output.slice(0, 80)}
        </div>
      )}
    </div>
  );
}
