import React, { useState } from "react";
import { SessionList } from "./pages/SessionList.js";
import { ResultView } from "./pages/ResultView.js";
import { PendingList } from "./pages/PendingList.js";

type Page = "sessions" | "pending" | "result";

export function App() {
  const [page, setPage] = useState<Page>("sessions");
  const [resultData, setResultData] = useState<any>(null);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 32 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Sojourn</h1>
        <nav style={{ display: "flex", gap: 12 }}>
          <NavButton active={page === "sessions"} onClick={() => setPage("sessions")}>
            Sessions
          </NavButton>
          <NavButton active={page === "pending"} onClick={() => setPage("pending")}>
            Pending
          </NavButton>
        </nav>
      </header>

      {page === "sessions" && (
        <SessionList
          onDistilled={(result) => {
            setResultData(result);
            setPage("result");
          }}
        />
      )}
      {page === "pending" && <PendingList />}
      {page === "result" && resultData && (
        <ResultView result={resultData} onBack={() => setPage("sessions")} />
      )}
    </div>
  );
}

function NavButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "#2563eb" : "transparent",
        color: active ? "#fff" : "#a1a1aa",
        border: "1px solid",
        borderColor: active ? "#2563eb" : "#27272a",
        borderRadius: 6,
        padding: "6px 14px",
        cursor: "pointer",
        fontSize: 13,
      }}
    >
      {children}
    </button>
  );
}
