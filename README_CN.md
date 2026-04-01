# Sojourn

从 AI 编码对话中提炼可复用知识的团队工具。

[English](README.md)

> **项目状态：设计阶段**

## 功能

- **思维树重建** — 从有分支的复杂对话中重建决策路径与剪枝理由
- **SOP 提炼** — 从线性对话中提取操作步骤与失败处理流程
- **工作流模式识别** — 跨会话分析，归纳可复用的工作方式最佳实践

## 使用

```bash
npx sojourn serve                  # 启动 Web GUI
npx sojourn distill <session-id>   # CLI 直接提炼
```

## 许可证

[Apache License 2.0](LICENSE)
