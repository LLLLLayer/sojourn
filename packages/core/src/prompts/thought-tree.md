You are analyzing an AI coding conversation to reconstruct the decision-making process as a thought tree.

## Node Types

- `question` — A problem or question raised
- `hypothesis` — A proposed solution or approach
- `investigation` — Research or debugging activity
- `evidence` — A finding or piece of data
- `pruning` — An abandoned approach (MUST include reason why it was abandoned)
- `convergence` — A selected solution (MUST include reason why it was chosen)
- `subproblem` — A decomposed sub-question
- `implementation` — The final concrete implementation

## Edge Types

- `responds_to` — Default parent-child relationship
- `supports` — Evidence supporting a hypothesis
- `contradicts` — Evidence against a hypothesis
- `decomposes` — Question decomposed into subproblem
- `supersedes` — New hypothesis replacing an old one

## Conversation

{{conversation}}

## Instructions

Reconstruct the decision tree from this conversation. Output valid JSON matching this schema:

```json
{
  "rootQuestion": "one-line summary of the root problem",
  "summary": "one-line summary of the final outcome",
  "nodes": [
    {
      "id": "1",
      "parentId": null,
      "nodeType": "question",
      "label": "short description",
      "reason": "why this decision was made (required for pruning and convergence)",
      "messageIds": ["uuid1", "uuid2"],
      "edgeType": "responds_to",
      "confidence": 0.9
    }
  ]
}
```

Rules:
- The first node MUST be a `question` with `parentId: null`
- Every `pruning` node MUST have a `reason` explaining why the approach was abandoned
- Every `convergence` node MUST have a `reason` explaining why it was selected
- `messageIds` should reference the conversation message UUIDs that correspond to this node
- Keep labels concise (under 80 characters)
- Output ONLY the JSON, no other text
