# Sojourn

Sojourn is a team tool that automatically distills reusable knowledge from AI coding conversations. It reads conversation logs from AI coding assistants (Claude Code, opencode, Cursor), reconstructs the decision process through AI analysis into three types of structured knowledge — **thought trees** (decision paths and pruning reasons from branching conversations), **SOPs** (standard operating procedures from linear conversations), and **workflow patterns** (best practices identified across multiple sessions) — then outputs the results to pluggable sinks such as CLAUDE.md, shared Git repositories, Memory, .cursorrules, and Feishu Wiki, turning one person's hard-won experience into reusable team knowledge that AI can automatically follow in future conversations.

[中文文档](README_CN.md)

## Features

- **Thought Tree Reconstruction** — Rebuild decision paths and pruning reasons from branching conversations, with 8 node types based on IBIS, Toulmin, and Fault Tree frameworks
- **SOP Extraction** — Extract step-by-step procedures with failure handling and preconditions from linear conversations
- **Workflow Pattern Recognition** — Cross-session analysis to identify recurring best practices
- **3 Parsers** — Claude Code (JSONL), opencode (SQLite), Cursor (vscdb), with auto-detection
- **7 Sinks** — CLAUDE.md, file, Git repo (auto PR), Memory, .cursorrules, Feishu Wiki
- **2 Analyzers** — Claude Code CLI (no API key needed), Anthropic API
- **Knowledge Dedup** — Detects similar results before committing
- **Web GUI** — Session cards, project tabs, conversation preview drawer, thought tree / SOP / workflow visualization, pending management, result editor, settings
- **Team Sharing** — Git repository sink with automatic PR creation for team review
- **Async Distill** — Non-blocking analysis with polling progress
- **64 Tests** — Parser, Classifier, Store, Analyzer, Config, Detect, Sink, Server, Dedup

## Usage

```bash
pnpm install && pnpm build

# Web GUI
node packages/cli/dist/index.js serve

# CLI
node packages/cli/dist/index.js sessions
node packages/cli/dist/index.js distill <session.jsonl>
node packages/cli/dist/index.js distill c4329027           # partial session ID
node packages/cli/dist/index.js distill -m thought_tree <session.jsonl>
node packages/cli/dist/index.js distill -s claude-md -o ./CLAUDE.md <session.jsonl>
node packages/cli/dist/index.js distill -s cursorrules <session.jsonl>
node packages/cli/dist/index.js distill --json <session.jsonl>

# Pending management
node packages/cli/dist/index.js pending list
node packages/cli/dist/index.js pending commit <id> -s claude-md

# Git repo sharing
node packages/cli/dist/index.js repo bind <name> <url>
node packages/cli/dist/index.js repo list

# Configuration & diagnostics
node packages/cli/dist/index.js config show
node packages/cli/dist/index.js doctor
node packages/cli/dist/index.js install-hook
```

## Architecture

TypeScript monorepo (pnpm workspace), 5 packages:

- **`packages/shared`** — Shared types (MessageTree, 8 thought tree node types, SOP, Workflow)
- **`packages/core`** — Parser, Analyzer, Distiller, Prompts, Sink, Store, Hooks, Config, Dedup, Formatter
- **`packages/cli`** — CLI commands
- **`packages/server`** — Hono API server
- **`packages/web`** — React frontend

## License

[Apache License 2.0](LICENSE)
