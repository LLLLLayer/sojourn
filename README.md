# Sojourn

A team tool that distills reusable knowledge from AI coding conversations.

[中文文档](README_CN.md)

> **Status: Design Phase**

## Features

- **Thought Tree Reconstruction** — Rebuild decision paths and pruning reasons from branching conversations
- **SOP Extraction** — Extract step-by-step procedures and failure handling from linear conversations
- **Workflow Pattern Recognition** — Cross-session analysis to identify recurring best practices

## Usage

```bash
pip install sojourn
sojourn serve                      # Launch Web GUI
sojourn distill <session-id>       # CLI distillation
```

## License

[Apache License 2.0](LICENSE)
