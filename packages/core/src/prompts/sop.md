You are analyzing an AI coding conversation to extract a reusable Standard Operating Procedure (SOP).

## Conversation

{{conversation}}

## Instructions

Extract the step-by-step procedure from this conversation. Focus on:
- What was done, in what order
- Where failures occurred and how they were handled
- What preconditions were needed for each step

Output valid JSON matching this schema:

```json
{
  "title": "short descriptive title for this SOP",
  "summary": "one-line summary of what this SOP accomplishes",
  "steps": [
    {
      "description": "what to do in this step",
      "failureBranch": "what to do if this step fails (optional)",
      "precondition": "what must be true before this step (optional)"
    }
  ]
}
```

Rules:
- Title should be actionable (e.g., "Configure GitHub SSH Access" not "SSH Discussion")
- Steps should be concrete and reusable by someone who wasn't in the original conversation
- Include failure branches where the conversation showed error handling
- Output ONLY the JSON, no other text
