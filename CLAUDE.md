# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本仓库中工作时提供指引。

## 项目概述

Sojourn 是一个从 AI 编码对话中提炼可复用知识的团队工具。

## 项目状态

MVP 开发中。核心管线（JSONL 解析 → 消息树构建 → AI 分析 → 结构化输出）已跑通。

## 开发

```bash
pnpm install        # 安装依赖
pnpm build          # 构建所有包
```

## 使用

```bash
# 列出所有会话
node packages/cli/dist/index.js sessions

# 提炼知识（默认自动判定模式，使用 Claude Code CLI 分析）
node packages/cli/dist/index.js distill <session.jsonl>

# 指定模式
node packages/cli/dist/index.js distill -m thought_tree <session.jsonl>
node packages/cli/dist/index.js distill -m sop <session.jsonl>

# JSON 输出
node packages/cli/dist/index.js distill --json <session.jsonl>

# 使用 Anthropic API（需要 ANTHROPIC_API_KEY）
node packages/cli/dist/index.js distill -a claude-api <session.jsonl>
```

## 架构

TypeScript monorepo（pnpm workspace），三层可插拔管线：

- **`packages/shared`** — 共享类型（Message, MessageTree, ThoughtTreeResult, SOPResult 等）
- **`packages/core`** — 核心逻辑：Parser（JSONL 解析）、Analyzer（AI 分析）、Distiller（分类）、Prompts（模板）、Registry（注册表）
- **`packages/cli`** — CLI 入口：`distill`、`sessions` 命令

Analyzer 可插拔：`claude-code`（默认，调用本地 Claude Code CLI）、`claude-api`（Anthropic API）。

## 文档

- `docs/internal/proposal.md` — 项目书：目标、功能、用户流程、风险、竞品
- `docs/internal/architecture.md` — 技术架构：选型、结构、数据流、API、配置
- `docs/internal/thought-tree-spec.md` — 思维树规范：节点类型、边关系、数据模型
- `research/CLAUDE.md` — 竞品分析与研究笔记（10 个参考项目）
