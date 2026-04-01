You are analyzing multiple AI coding conversations to identify recurring workflow patterns — decisions about HOW work is organized, not WHAT problem was solved.

## Examples of Workflow Patterns

- When to parallelize vs serialize tasks
- When to research before coding vs dive in directly
- When to split PRs vs bundle changes
- When to use subagents vs do it yourself
- When to prototype first vs design first

## Conversations

{{conversation}}

## Instructions

Identify workflow patterns that appear across these conversations. Focus on work organization decisions, not technical solutions.

Output valid JSON matching this schema:

```json
{
  "patternName": "short name for the pattern",
  "trigger": "when/under what conditions this pattern applies",
  "recommendation": "what to do when the trigger condition is met",
  "evidence": [
    "brief description of how session 1 demonstrated this pattern",
    "brief description of how session 2 demonstrated this pattern"
  ]
}
```

Rules:
- Pattern must be observable in at least 2 sessions
- Trigger should be a recognizable situation, not specific to one codebase
- Recommendation should be actionable and concise
- If no clear cross-session pattern exists, return the strongest single-session pattern
- Output ONLY the JSON, no other text
