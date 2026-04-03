import React, { useEffect, useState } from "react";
import type { AppConfig } from "../types.js";
import { Section, OptionButton, ActionButton, inputStyle } from "../components/settings/Section.js";

function applyFontSize(size: number) {
  const scale = size / 15;
  document.documentElement.style.zoom = String(scale);
}

export function Settings() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newRepoName, setNewRepoName] = useState("");
  const [newRepoUrl, setNewRepoUrl] = useState("");

  useEffect(() => {
    fetch("/api/config").then((r) => r.json()).then((d) => { setConfig(d); setLoading(false); });
  }, []);

  const save = async (updated: Partial<AppConfig>) => {
    setSaving(true); setSaved(false);
    const merged = { ...config, ...updated };
    await fetch("/api/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(merged) });
    setConfig(merged as AppConfig);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const bindRepo = async () => {
    if (!newRepoName || !newRepoUrl) return;
    await fetch("/api/config/bind-repo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newRepoName, url: newRepoUrl }) });
    setNewRepoName(""); setNewRepoUrl("");
    const res = await fetch("/api/config"); setConfig(await res.json());
  };
  const unbindRepo = async (name: string) => {
    await fetch(`/api/config/unbind-repo/${encodeURIComponent(name)}`, { method: "DELETE" });
    const res = await fetch("/api/config"); setConfig(await res.json());
  };
  const switchRepo = async (name: string) => {
    await fetch("/api/config/switch-repo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const res = await fetch("/api/config"); setConfig(await res.json());
  };

  if (loading || !config) return <div style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>Loading...</div>;

  return (
    <div className="anim-up">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 26, fontWeight: 400 }}>Settings</h2>
        {saved && <span className="anim-in" style={{ color: "var(--green)", fontSize: 12, fontFamily: "var(--font-mono)" }}>Saved</span>}
      </div>

      {/* Language */}
      <Section title="Language" description="Controls the language of distilled output (titles, steps, reasons).">
        <div style={{ display: "flex", gap: 8 }}>
          <OptionButton active={config.language === "zh"} onClick={() => save({ language: "zh" })}>中文</OptionButton>
          <OptionButton active={config.language === "en"} onClick={() => save({ language: "en" })}>English</OptionButton>
        </div>
      </Section>

      {/* Font Size */}
      <Section title="Font Size" description="Scales the entire interface.">
        <div style={{ display: "flex", gap: 8 }}>
          {[{ label: "S", value: 14 }, { label: "M", value: 15 }, { label: "L", value: 16 }, { label: "XL", value: 17 }].map((opt) => (
            <OptionButton key={opt.value} active={(config.fontSize ?? 16) === opt.value}
              onClick={() => { save({ fontSize: opt.value }); applyFontSize(opt.value); }}>
              {opt.label}
            </OptionButton>
          ))}
        </div>
      </Section>

      {/* Analyzer */}
      <Section title="Analyzer" description="The AI backend used for distillation.">
        <div style={{ display: "flex", gap: 8 }}>
          <OptionButton active={config.defaultAnalyzer === "claude-code"} onClick={() => save({ defaultAnalyzer: "claude-code" })}>Claude Code CLI</OptionButton>
          <OptionButton active={config.defaultAnalyzer === "claude-api"} onClick={() => save({ defaultAnalyzer: "claude-api" })}>Anthropic API</OptionButton>
        </div>
        {config.defaultAnalyzer === "claude-api" && (
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 11, color: "var(--text-tertiary)", display: "block", marginBottom: 4, fontFamily: "var(--font-mono)" }}>API Key</label>
            <input type="password" value={config.analyzers?.["claude-api"]?.apiKey ?? ""}
              onChange={(e) => setConfig({ ...config, analyzers: { ...config.analyzers, "claude-api": { ...config.analyzers?.["claude-api"], apiKey: e.target.value } } })}
              onBlur={() => save({ analyzers: config.analyzers })}
              style={inputStyle} placeholder="sk-ant-..." />
          </div>
        )}
      </Section>

      {/* Default Sinks */}
      <Section title="Default Sink" description="Where distilled knowledge is output by default.">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["claude-md", "file", "git-repo", "memory", "cursorrules", "feishu"].map((sink) => (
            <OptionButton key={sink} active={config.defaultSinks?.includes(sink)}
              onClick={() => { const sinks = config.defaultSinks?.includes(sink) ? config.defaultSinks.filter((s) => s !== sink) : [...(config.defaultSinks ?? []), sink]; save({ defaultSinks: sinks }); }}>
              {sink}
            </OptionButton>
          ))}
        </div>
      </Section>

      {/* Git Repos */}
      <Section title="Git Repositories" description="Shared knowledge repositories for team collaboration.">
        {config.git?.repos?.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {config.git.repos.map((repo) => (
              <div key={repo.name} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                borderRadius: "var(--radius-s)", background: "var(--bg-subtle)",
                border: repo.name === config.git.activeRepo ? "1px solid var(--accent-light)" : "1px solid var(--border-hairline)",
                marginBottom: 4, fontSize: 12, fontFamily: "var(--font-mono)",
              }}>
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{repo.name}</span>
                <span style={{ color: "var(--text-tertiary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{repo.url}</span>
                {repo.name === config.git.activeRepo
                  ? <span style={{ color: "var(--accent)", fontSize: 10, letterSpacing: "0.06em" }}>ACTIVE</span>
                  : <ActionButton color="var(--blue)" onClick={() => switchRepo(repo.name)}>activate</ActionButton>}
                <ActionButton color="var(--red)" onClick={() => unbindRepo(repo.name)}>unbind</ActionButton>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: "var(--text-tertiary)", display: "block", marginBottom: 4, fontFamily: "var(--font-mono)" }}>Name</label>
            <input value={newRepoName} onChange={(e) => setNewRepoName(e.target.value)} style={inputStyle} placeholder="team-knowledge" />
          </div>
          <div style={{ flex: 2 }}>
            <label style={{ fontSize: 11, color: "var(--text-tertiary)", display: "block", marginBottom: 4, fontFamily: "var(--font-mono)" }}>URL</label>
            <input value={newRepoUrl} onChange={(e) => setNewRepoUrl(e.target.value)} style={inputStyle} placeholder="git@github.com:org/knowledge.git" />
          </div>
          <button onClick={bindRepo} disabled={!newRepoName || !newRepoUrl} style={{
            background: newRepoName && newRepoUrl ? "var(--text-primary)" : "var(--bg-subtle)",
            color: newRepoName && newRepoUrl ? "#fff" : "var(--text-tertiary)",
            border: "none", borderRadius: "var(--radius-s)", padding: "8px 16px",
            fontSize: 12, fontFamily: "var(--font-mono)", cursor: newRepoName && newRepoUrl ? "pointer" : "default", fontWeight: 500, whiteSpace: "nowrap",
          }}>Bind</button>
        </div>
      </Section>

      {/* Agent Log Path */}
      <Section title="Agent Log Path" description="Where to find Claude Code session logs.">
        <input value={config.agents?.["claude-code"]?.logPath ?? ""}
          onChange={(e) => setConfig({ ...config, agents: { ...config.agents, "claude-code": { logPath: e.target.value } } })}
          onBlur={() => save({ agents: config.agents })}
          style={inputStyle} placeholder="~/.claude/projects/" />
      </Section>
    </div>
  );
}
