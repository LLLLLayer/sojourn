export type Language = "zh" | "en";

const translations = {
  zh: {
    // App
    "app.title": "Sojourn",
    "app.subtitle": "知识提炼",
    "app.version": "v0.1.0",

    // Nav
    "nav.sessions": "会话",
    "nav.pending": "暂存",

    // Sessions
    "sessions.title": "会话",
    "sessions.count": (n: number, s: number) => `${n} 个会话 · 已选 ${s} 个`,
    "sessions.distill": "提炼",
    "sessions.distilling": "提炼中...",
    "sessions.loading": "加载会话中...",

    // Pending
    "pending.title": "暂存",
    "pending.awaiting": (n: number, t: number) => `${n} 个待审阅 · 共 ${t} 个`,
    "pending.empty": "暂无提炼结果",
    "pending.commit": "提交",
    "pending.discard": "丢弃",
    "pending.commitTo": "提交到 CLAUDE.md",
    "pending.backToList": "← 返回列表",
    "pending.committedTo": (s: string) => `已提交至 ${s}`,

    // Results
    "result.backToSessions": "← 返回会话",
    "result.thoughtTree": "思维树",
    "result.sop": "标准操作流程",
    "result.workflow": "工作流模式",
    "result.when": "触发条件",
    "result.do": "推荐做法",
    "result.evidence": (n: number) => `来自 ${n} 个会话的证据`,
    "result.precondition": "前置条件",
    "result.onFailure": "失败处理",

    // Status
    "status.pending": "待审阅",
    "status.editing": "编辑中",
    "status.committed": "已提交",
    "status.discarded": "已丢弃",
  },
  en: {
    "app.title": "Sojourn",
    "app.subtitle": "knowledge distillation",
    "app.version": "v0.1.0",

    "nav.sessions": "Sessions",
    "nav.pending": "Pending",

    "sessions.title": "Sessions",
    "sessions.count": (n: number, s: number) => `${n} sessions · ${s} selected`,
    "sessions.distill": "Distill",
    "sessions.distilling": "Distilling...",
    "sessions.loading": "Loading sessions...",

    "pending.title": "Pending",
    "pending.awaiting": (n: number, t: number) => `${n} awaiting review · ${t} total`,
    "pending.empty": "No pending results",
    "pending.commit": "commit",
    "pending.discard": "discard",
    "pending.commitTo": "Commit to CLAUDE.md",
    "pending.backToList": "← back to list",
    "pending.committedTo": (s: string) => `committed to ${s}`,

    "result.backToSessions": "← back to sessions",
    "result.thoughtTree": "Thought Tree",
    "result.sop": "Standard Operating Procedure",
    "result.workflow": "Workflow Pattern",
    "result.when": "When",
    "result.do": "Do",
    "result.evidence": (n: number) => `Evidence from ${n} sessions`,
    "result.precondition": "PRE",
    "result.onFailure": "FAIL",

    "status.pending": "pending",
    "status.editing": "editing",
    "status.committed": "committed",
    "status.discarded": "discarded",
  },
} as const;

type TranslationMap = typeof translations.zh;
type TranslationKey = keyof TranslationMap;

let currentLang: Language = "zh";

export function setLanguage(lang: Language) {
  currentLang = lang;
}

export function getLanguage(): Language {
  return currentLang;
}

export function t(key: TranslationKey, ...args: any[]): string {
  const val = translations[currentLang]?.[key] ?? translations.en[key] ?? key;
  if (typeof val === "function") return (val as any)(...args);
  return val as string;
}
