import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { SessionDetail } from "../types.js";
import { MessageBubble } from "./chat/MessageBubble.js";

export function ChatPreview({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const [data, setData] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(50);

  useEffect(() => {
    setLoading(true); setError(null);
    fetch(`/api/sessions/${sessionId}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => { if (d.error) throw new Error(d.error); setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [sessionId]);

  const msgs = (data?.messages ?? []).filter((m) => {
    if ((m.role === "system" || m.role === "result") && !m.content.trim()) return false;
    if (m.role === "assistant" && !m.content.trim() && !m.toolUses?.length) return false;
    return true;
  });
  const visible = msgs.slice(0, visibleCount);

  return createPortal(
    <div className="drawer-backdrop" onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 9990, display: "flex", justifyContent: "flex-end", background: "rgba(0,0,0,0.18)", backdropFilter: "blur(2px)" }}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}
        style={{ width: "min(520px, 85vw)", height: "100vh", background: "var(--bg-surface)", boxShadow: "-8px 0 40px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid var(--border-hairline)", flexShrink: 0 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontFamily: "var(--font-serif)", color: "var(--text-primary)", fontWeight: 500 }}>Conversation</div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {sessionId.slice(0, 12)}...{data && ` · ${data.messageCount} msgs · ${data.isLinear ? "linear" : data.branchCount + " branches"}`}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "var(--bg-subtle)", border: "none", borderRadius: "var(--radius-m)", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-tertiary)", fontSize: 16, flexShrink: 0 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-muted)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; }}>
            ×
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
          {loading ? (
            <div style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-serif)", fontStyle: "italic", textAlign: "center", padding: 40 }}>Loading...</div>
          ) : error ? (
            <div style={{ color: "var(--red)", textAlign: "center", padding: 40, fontFamily: "var(--font-mono)", fontSize: 12 }}>{error}</div>
          ) : msgs.length === 0 ? (
            <div style={{ color: "var(--text-tertiary)", textAlign: "center", padding: 40 }}>Empty session</div>
          ) : (
            <>
              {visible.map((msg, i) => <MessageBubble key={msg.id || i} message={msg} />)}
              {msgs.length > visibleCount && (
                <button onClick={() => setVisibleCount((n) => n + 50)} style={{
                  display: "block", width: "100%", padding: "10px", background: "var(--bg-subtle)", border: "none",
                  borderRadius: "var(--radius-s)", color: "var(--text-secondary)", fontSize: 12, fontFamily: "var(--font-mono)", cursor: "pointer", marginTop: 8,
                }}>
                  Show more ({msgs.length - visibleCount} remaining)
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
