# Sojourn

Sojourn is a team tool that automatically distills reusable knowledge from AI coding conversations. It reads conversation logs from AI coding assistants (Claude Code, opencode, etc.), reconstructs the decision process through AI analysis into three types of structured knowledge — **thought trees** (decision paths and pruning reasons from branching conversations), **SOPs** (standard operating procedures from linear conversations), and **workflow patterns** (best practices identified across multiple sessions) — then outputs the results to pluggable sinks such as CLAUDE.md, shared Git repositories, and Memory, turning one person's hard-won experience into reusable team knowledge that AI can automatically follow in future conversations.

[中文文档](README_CN.md)

## Features

- **Thought Tree Reconstruction** — Rebuild decision paths and pruning reasons from branching conversations, with 8 node types based on IBIS, Toulmin, and Fault Tree frameworks
- **SOP Extraction** — Extract step-by-step procedures with failure handling and preconditions from linear conversations
- **Workflow Pattern Recognition** — Cross-session analysis to identify recurring best practices
- **Pluggable Architecture** — Parsers (Claude Code JSONL, opencode SQLite), Analyzers (Claude Code CLI, Anthropic API), Sinks (CLAUDE.md, Git repo, Memory, file)
- **Web GUI** — Browse sessions, preview conversations, distill knowledge, manage pending results
- **Team Sharing** — Git repository sink with automatic PR creation for team review

## Usage

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

# Pending management
node packages/cli/dist/index.js pending list
node packages/cli/dist/index.js pending commit <id> -s claude-md

# Configuration
node packages/cli/dist/index.js config show
node packages/cli/dist/index.js doctor
```

## Architecture

TypeScript monorepo (pnpm workspace), 5 packages:

- **`packages/shared`** — Shared types (MessageTree, 8 thought tree node types, SOP, Workflow)
- **`packages/core`** — Parser, Analyzer, Distiller, Prompts, Sink, Store, Hooks, Config
- **`packages/cli`** — CLI commands
- **`packages/server`** — Hono API server
- **`packages/web`** — React frontend

## License

[Apache License 2.0](LICENSE)
