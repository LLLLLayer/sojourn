# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本仓库中工作时提供指引。

## 项目概述

Sojourn 是一个从 AI 编码对话中提炼可复用知识的团队工具。

## 开发

```bash
pnpm install        # 安装依赖
pnpm build          # 构建所有包
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

# 输出到 sink
node packages/cli/dist/index.js distill -s claude-md -o ./CLAUDE.md <session.jsonl>
node packages/cli/dist/index.js distill -s memory <session.jsonl>
node packages/cli/dist/index.js distill -s git-repo <session.jsonl>

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
- **`packages/core`** — Parser（Claude Code JSONL, opencode SQLite）、Analyzer（Claude Code CLI, API）、Distiller、Prompts、Sink（claude-md, file, git-repo, memory）、Store、Hooks、Config
- **`packages/cli`** — CLI 命令
- **`packages/server`** — Hono API 服务
- **`packages/web`** — React 前端

## 文档

- `docs/internal/proposal.md` — 项目书
- `docs/internal/architecture.md` — 技术架构
- `docs/internal/thought-tree-spec.md` — 思维树规范
- `docs/internal/development-plan.md` — 开发计划
- `research/CLAUDE.md` — 竞品分析与研究笔记

## Sojourn 知识提炼

### Clone a GitHub Repository and Configure SSH Push Access
_2026-04-01 | SOP | session: c4329027-540f-4b4e-838b-509cf86958f9_

1. Attempt to clone the repository using SSH (git clone git@github.com:user/repo.git)
   - 失败处理: If SSH clone fails with 'Permission denied (publickey)', fall back to cloning via HTTPS (git clone https://github.com/user/repo.git)
2. Check if an SSH key already exists (~/.ssh/id_ed25519.pub or ~/.ssh/id_rsa.pub)
   - 失败处理: If no key exists, generate a new Ed25519 key: ssh-keygen -t ed25519 -C 'your_email@example.com' -f ~/.ssh/id_ed25519 -N ''
3. Test SSH connectivity to GitHub: ssh -T git@github.com
   - 失败处理: If connection fails, the public key needs to be added to GitHub. Proceed to next step.
4. Display the public key contents: cat ~/.ssh/id_ed25519.pub
5. Verify the key is in OpenSSH format (should start with 'ssh-ed25519' or 'ssh-rsa'). If GitHub rejects an old RSA key format, generate a new Ed25519 key: ssh-keygen -t ed25519 -C 'your_email@example.com' -f ~/.ssh/id_ed25519 -N ''
   - 失败处理: If the key format is rejected by GitHub ('Key is invalid. You must supply a key in OpenSSH public key format'), generate a new Ed25519 key and use that instead
6. Add the public key to GitHub: go to GitHub → Settings → SSH and GPG keys → New SSH key. Set Title to a machine identifier (e.g. 'MacBook'), keep Key type as 'Authentication Key', paste the public key into the Key field, and click 'Add SSH key'
7. Verify SSH authentication works: ssh -T git@github.com. Expected output: 'Hi username! You've successfully authenticated...'
   - 失败处理: If still failing, check that the correct key is being offered (ssh -vT git@github.com) and that ssh-agent has the key loaded
8. If the repository was cloned via HTTPS, switch the remote URL to SSH: git remote set-url origin git@github.com:user/repo.git
9. Verify the remote URL is set correctly: git remote -v (should show git@github.com:... for both fetch and push)
