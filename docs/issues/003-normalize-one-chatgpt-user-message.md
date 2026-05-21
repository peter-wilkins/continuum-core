# 003: Normalize One ChatGPT User Message

## Type

AFK.

## Blocked by

- [002: Rank Import Sources and Schema Targets](002-rank-import-sources-and-schema-targets.md)

## What to build

Normalize one ChatGPT message node into one canonical event record.

This is the first real importer slice. It should not solve whole-export parsing, branches, attachments, dedupe, or sync. It should prove the smallest path from a source record to the unified event model.

## First failing test

Given one ChatGPT conversation and one user message node, normalization returns one event preserving actor, time, content, source reference, and source graph reference.

```ts
const event = normalizeChatGptMessage({
  conversation: {
    id: "conv_123",
    title: "Boiler quote",
    create_time: 1779360000,
    update_time: 1779360300,
  },
  node: {
    id: "msg_456",
    parent: "msg_parent",
    children: [],
    message: {
      id: "msg_456",
      create_time: 1779360123,
      author: { role: "user" },
      content: {
        content_type: "text",
        parts: ["Need to quote Bob for the boiler."],
      },
    },
  },
});

expect(event.actor.role).toBe("user");
expect(event.content.text).toBe("Need to quote Bob for the boiler.");
expect(event.source.externalConversationId).toBe("conv_123");
expect(event.source.externalMessageId).toBe("msg_456");
expect(event.source.externalParentId).toBe("msg_parent");
```

## Acceptance Criteria

- [ ] ChatGPT user text message normalizes into one canonical event.
- [ ] Event has core-owned internal id or deterministic test id.
- [ ] Event preserves source platform, conversation id, message id, and parent source id.
- [ ] Event distinguishes source graph parent id from canonical parent event id.
- [ ] Event preserves created time with explicit time confidence.
- [ ] Missing fields are represented explicitly where the canonical model requires knowledge.
- [ ] Test uses public importer API or intentionally exported adapter API.

## TDD Notes

- Red: write this one-message test first.
- Green: create only the canonical fields forced by one ChatGPT user message.
- Refactor: do not generalize to Claude/Gmail/Wikimedia yet.
