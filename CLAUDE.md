# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本仓库中工作时提供指引。

## 项目概述

Sojourn 是一个从 AI 编码对话中自动提炼可复用知识的团队工具。读取 Claude Code、opencode、Cursor 等对话日志，通过 AI 分析重建为思维树、SOP、工作流模式三种结构化知识，输出到 CLAUDE.md、Git 仓库、Memory 等可插拔 sink。

## 开发

```bash
pnpm install        # 安装依赖（含 better-sqlite3 native build）
pnpm build          # 构建所有包
pnpm lint           # ESLint 检查
pnpm test           # 运行测试（vitest, 64 tests, 10 files）
```

## 使用

```bash
# 列出会话
node packages/cli/dist/index.js sessions

# 提炼（默认 claude-code analyzer，自动判定模式）
node packages/cli/dist/index.js distill <session.jsonl>
node packages/cli/dist/index.js distill -m thought_tree <session.jsonl>
node packages/cli/dist/index.js distill -m sop <session.jsonl>
node packages/cli/dist/index.js distill --json <session.jsonl>

# 支持 session ID 部分匹配
node packages/cli/dist/index.js distill c4329027

# 输出到 sink（7 种）
node packages/cli/dist/index.js distill -s claude-md -o ./CLAUDE.md <session.jsonl>
node packages/cli/dist/index.js distill -s memory <session.jsonl>
node packages/cli/dist/index.js distill -s git-repo <session.jsonl>
node packages/cli/dist/index.js distill -s cursorrules <session.jsonl>
node packages/cli/dist/index.js distill -s feishu <session.jsonl>

# 暂存管理
node packages/cli/dist/index.js pending list
node packages/cli/dist/index.js pending commit <id> -s claude-md

# Git 仓库管理
node packages/cli/dist/index.js repo bind <name> <url>
node packages/cli/dist/index.js repo list

# Hook 管理
node packages/cli/dist/index.js install-hook
node packages/cli/dist/index.js doctor

# Web GUI
node packages/cli/dist/index.js serve
```

## 架构

TypeScript monorepo（pnpm workspace），5 个包：

- **`packages/shared`** — 共享类型（MessageTree, 8 种思维树节点类型, SOP, Workflow）
- **`packages/core`** — Parser（Claude Code JSONL, opencode SQLite, Cursor vscdb）、Analyzer（Claude Code CLI, API）、Distiller、Prompts、Sink（claude-md, file, git-repo, memory, cursorrules, feishu）、Store、Hooks、Config、Dedup
- **`packages/cli`** — CLI 命令
- **`packages/server`** — Hono API 服务（路径安全校验、配置深合并、异步 distill）
- **`packages/web`** — React 前端（会话卡片网格、项目 tab、对话预览抽屉、思维树/SOP/工作流可视化、暂存管理、结果编辑器、设置页）

## 文档

- `docs/internal/proposal.md` — 项目书
- `docs/internal/architecture.md` — 技术架构
- `docs/internal/thought-tree-spec.md` — 思维树规范
- `docs/internal/development-plan.md` — 开发计划
- `research/CLAUDE.md` — 竞品分析与研究笔记
