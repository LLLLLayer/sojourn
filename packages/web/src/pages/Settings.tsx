import React, { useEffect, useState } from "react";

interface Config {
  language: string;
  defaultAnalyzer: string;
  defaultSinks: string[];
  analyzers: Record<string, any>;
  sinks: Record<string, any>;
  git: { repos: Array<{ name: string; url: string }>; activeRepo: string | null };
  agents: Record<string, { logPath: string }>;
}

export function Settings() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Repo binding
  const [newRepoName, setNewRepoName] = useState("");
  const [newRepoUrl, setNewRepoUrl] = useState("");

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        setConfig(data);
        setLoading(false);
      });
  }, []);

  const save = async (updated: Partial<Config>) => {
    setSaving(true);
    setSaved(false);
    const merged = { ...config, ...updated };
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(merged),
    });
    setConfig(merged as Config);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const bindRepo = async () => {
    if (!newRepoName || !newRepoUrl) return;
    await fetch("/api/config/bind-repo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newRepoName, url: newRepoUrl }),
    });
    setNewRepoName("");
    setNewRepoUrl("");
    // Reload config
    const res = await fetch("/api/config");
    setConfig(await res.json());
  };

  const unbindRepo = async (name: string) => {
    await fetch(`/api/config/unbind-repo/${encodeURIComponent(name)}`, { method: "DELETE" });
    const res = await fetch("/api/config");
    setConfig(await res.json());
  };

  const switchRepo = async (name: string) => {
    await fetch("/api/config/switch-repo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const res = await fetch("/api/config");
    setConfig(await res.json());
  };

  if (loading || !config) {
    return (
      <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-display)", fontStyle: "italic" }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <h2 style={{
          fontFamily: "var(--font-display)",
          fontSize: 28,
          fontWeight: 400,
          color: "var(--text-primary)",
          letterSpacing: "-0.03em",
        }}>
          Settings
        </h2>
        {saved && (
          <span className="animate-fade-in" style={{ color: "var(--accent-sage)", fontSize: 12, fontFamily: "var(--font-mono)" }}>
            Saved
          </span>
        )}
      </div>

      {/* Language */}
      <Section title="Language" description="Controls the language of distilled output (titles, steps, reasons).">
        <div style={{ display: "flex", gap: 8 }}>
          <OptionButton
            active={config.language === "zh"}
            onClick={() => save({ language: "zh" })}
          >
            中文
          </OptionButton>
          <OptionButton
            active={config.language === "en"}
            onClick={() => save({ language: "en" })}
          >
            English
          </OptionButton>
        </div>
      </Section>

      {/* Default Analyzer */}
      <Section title="Analyzer" description="The AI backend used for distillation.">
        <div style={{ display: "flex", gap: 8 }}>
          <OptionButton
            active={config.defaultAnalyzer === "claude-code"}
            onClick={() => save({ defaultAnalyzer: "claude-code" })}
          >
            Claude Code CLI
          </OptionButton>
          <OptionButton
            active={config.defaultAnalyzer === "claude-api"}
            onClick={() => save({ defaultAnalyzer: "claude-api" })}
          >
            Anthropic API
          </OptionButton>
        </div>
        {config.defaultAnalyzer === "claude-api" && (
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4, fontFamily: "var(--font-mono)" }}>
              API Key
            </label>
            <input
              type="password"
              value={config.analyzers?.["claude-api"]?.apiKey ?? ""}
              onChange={(e) => {
                const updated = {
                  ...config,
                  analyzers: {
                    ...config.analyzers,
                    "claude-api": { ...config.analyzers?.["claude-api"], apiKey: e.target.value },
                  },
                };
                setConfig(updated);
              }}
              onBlur={() => save({ analyzers: config.analyzers })}
              style={inputStyle}
              placeholder="sk-ant-..."
            />
          </div>
        )}
      </Section>

      {/* Default Sinks */}
      <Section title="Default Sink" description="Where distilled knowledge is output by default.">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["claude-md", "file", "git-repo", "memory"].map((sink) => (
            <OptionButton
              key={sink}
              active={config.defaultSinks?.includes(sink)}
              onClick={() => {
                const sinks = config.defaultSinks?.includes(sink)
                  ? config.defaultSinks.filter((s) => s !== sink)
                  : [...(config.defaultSinks ?? []), sink];
                save({ defaultSinks: sinks });
              }}
            >
              {sink}
            </OptionButton>
          ))}
        </div>
      </Section>

      {/* Git Repos */}
      <Section title="Git Repositories" description="Shared knowledge repositories for team collaboration.">
        {config.git?.repos?.length > 0 ? (
          <div style={{ marginBottom: 12 }}>
            {config.git.repos.map((repo) => (
              <div
                key={repo.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-elevated)",
                  border: repo.name === config.git.activeRepo
                    ? "1px solid var(--accent-amber-dim)"
                    : "1px solid var(--border-subtle)",
                  marginBottom: 4,
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                }}
              >
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{repo.name}</span>
                <span style={{ color: "var(--text-muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {repo.url}
                </span>
                {repo.name === config.git.activeRepo ? (
                  <span style={{ color: "var(--accent-amber)", fontSize: 10, letterSpacing: "0.06em" }}>ACTIVE</span>
                ) : (
                  <ActionButton color="var(--accent-sky)" onClick={() => switchRepo(repo.name)}>
                    activate
                  </ActionButton>
                )}
                <ActionButton color="var(--accent-terracotta)" onClick={() => unbindRepo(repo.name)}>
                  unbind
                </ActionButton>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)", fontSize: 12, fontStyle: "italic", fontFamily: "var(--font-display)", marginBottom: 12 }}>
            No repositories bound.
          </p>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4, fontFamily: "var(--font-mono)" }}>
              Name
            </label>
            <input
              value={newRepoName}
              onChange={(e) => setNewRepoName(e.target.value)}
              style={inputStyle}
              placeholder="team-knowledge"
            />
          </div>
          <div style={{ flex: 2 }}>
            <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4, fontFamily: "var(--font-mono)" }}>
              URL
            </label>
            <input
              value={newRepoUrl}
              onChange={(e) => setNewRepoUrl(e.target.value)}
              style={inputStyle}
              placeholder="git@github.com:org/knowledge.git"
            />
          </div>
          <button
            onClick={bindRepo}
            disabled={!newRepoName || !newRepoUrl}
            style={{
              background: newRepoName && newRepoUrl ? "var(--accent-amber)" : "var(--bg-elevated)",
              color: newRepoName && newRepoUrl ? "#fff" : "var(--text-muted)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              padding: "8px 16px",
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              cursor: newRepoName && newRepoUrl ? "pointer" : "default",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            Bind
          </button>
        </div>
      </Section>

      {/* Agent Log Path */}
      <Section title="Agent Log Path" description="Where to find Claude Code session logs.">
        <input
          value={config.agents?.["claude-code"]?.logPath ?? ""}
          onChange={(e) => {
            const updated = {
              ...config,
              agents: {
                ...config.agents,
                "claude-code": { logPath: e.target.value },
              },
            };
            setConfig(updated);
          }}
          onBlur={() => save({ agents: config.agents })}
          style={inputStyle}
          placeholder="~/.claude/projects/"
        />
      </Section>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      marginBottom: 28,
      paddingBottom: 24,
      borderBottom: "1px solid var(--border-subtle)",
    }}>
      <h3 style={{
        fontFamily: "var(--font-display)",
        fontSize: 16,
        fontWeight: 500,
        color: "var(--text-primary)",
        marginBottom: 4,
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: 12,
        color: "var(--text-muted)",
        fontFamily: "var(--font-mono)",
        marginBottom: 14,
      }}>
        {description}
      </p>
      {children}
    </div>
  );
}

function OptionButton({
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
        background: active ? "var(--bg-selected)" : "var(--bg-surface)",
        color: active ? "var(--text-warm)" : "var(--text-secondary)",
        border: active ? "1px solid var(--accent-amber-dim)" : "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-sm)",
        padding: "6px 16px",
        fontSize: 12,
        fontFamily: "var(--font-mono)",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      {children}
    </button>
  );
}

function ActionButton({
  color,
  onClick,
  children,
}: {
  color: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        color,
        border: `1px solid ${color}40`,
        borderRadius: "var(--radius-sm)",
        padding: "3px 10px",
        cursor: "pointer",
        fontSize: 11,
        fontFamily: "var(--font-mono)",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        (e.target as HTMLElement).style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLElement).style.borderColor = `${color}40`;
      }}
    >
      {children}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  background: "var(--bg-surface)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-primary)",
  fontSize: 12,
  fontFamily: "var(--font-mono)",
  outline: "none",
  transition: "border-color 0.2s ease",
};
