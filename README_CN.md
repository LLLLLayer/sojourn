# Sojourn

Sojourn 是一个从 AI 编码对话中自动提炼可复用知识的团队工具。它读取 Claude Code、opencode 等 AI 编码助手的对话日志，通过 AI 分析将对话重建为三种结构化知识——**思维树**（从分支对话中提取决策路径与剪枝理由）、**SOP**（从线性对话中提取标准操作流程）和**工作流模式**（跨会话归纳工作方式最佳实践），然后将提炼结果输出到 CLAUDE.md、Git 共享仓库、Memory 等可插拔的 sink 中，让一个人踩过的坑变成全团队可复用的知识资产，并反哺 AI 在后续对话中自动遵循最优路径。

[English](README.md)

## 功能

- **思维树重建** — 从有分支的复杂对话中重建决策路径与剪枝理由，基于 IBIS、Toulmin、故障树等框架设计的 8 种节点类型
- **SOP 提炼** — 从线性对话中提取操作步骤、失败处理和前置条件
- **工作流模式识别** — 跨会话分析，归纳可复用的工作方式最佳实践
- **可插拔架构** — Parser（Claude Code JSONL、opencode SQLite）、Analyzer（Claude Code CLI、Anthropic API）、Sink（CLAUDE.md、Git 仓库、Memory、文件）
- **Web GUI** — 浏览会话、预览对话、提炼知识、管理暂存结果
- **团队共享** — Git 仓库 Sink，自动创建 PR 供团队 Review

## 使用

```bash
pnpm install && pnpm build

# Web GUI
node packages/cli/dist/index.js serve

# CLI
node packages/cli/dist/index.js sessions
node packages/cli/dist/index.js distill <session.jsonl>
node packages/cli/dist/index.js distill -m thought_tree <session.jsonl>
node packages/cli/dist/index.js distill -s claude-md -o ./CLAUDE.md <session.jsonl>
node packages/cli/dist/index.js distill --json <session.jsonl>

# 暂存管理
node packages/cli/dist/index.js pending list
node packages/cli/dist/index.js pending commit <id> -s claude-md

# 配置
node packages/cli/dist/index.js config show
node packages/cli/dist/index.js doctor
```

## 架构

TypeScript monorepo（pnpm workspace），5 个包：

- **`packages/shared`** — 共享类型（MessageTree、8 种思维树节点类型、SOP、Workflow）
- **`packages/core`** — Parser、Analyzer、Distiller、Prompts、Sink、Store、Hooks、Config
- **`packages/cli`** — CLI 命令
- **`packages/server`** — Hono API 服务
- **`packages/web`** — React 前端

## 许可证

[Apache License 2.0](LICENSE)
