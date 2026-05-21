# 007: Pressure Test Model With Claude Export

## Type

HITL.

## Blocked by

- [003: Normalize One ChatGPT User Message](003-normalize-one-chatgpt-user-message.md)

## What to build

Gather Claude export schema evidence and add one red test that shows whether the ChatGPT-shaped canonical event model still works for Claude.

## First failing test

One Claude user/assistant exchange normalizes into the same canonical event shape used for ChatGPT without adding ChatGPT-specific fields.

## Acceptance Criteria

- [x] Claude export docs or representative fixture shape are recorded.
- [x] One Claude source record maps to canonical event fields.
- [x] Any model gap is documented before implementation.
- [x] ChatGPT-specific source graph assumptions are not baked into canonical fields.

## Evidence

- Official Anthropic compliance API docs describe chat metadata plus a `chat_messages` array sorted by `created_at`; message senders are user/assistant and each message carries text content.
- Observed Claude account exports use `conversations.json` as an array of conversations with `uuid`, `name`, `created_at`, `updated_at`, and `chat_messages[]`.
- Observed message fields used by this slice: `uuid`, `sender`, `text`, `created_at`, `content`, `attachments`, and `files`.
- Representative fixture: `src/fixtures/claude-one-conversation.json`.

Sources:

- https://platform.claude.com/docs/en/manage-claude/compliance-content-data
- https://platform.claude.com/docs/en/api/compliance/apps/chats/messages
- https://portable-ai-memory.org/providers/anthropic/

## Model Gap

Claude export evidence is mostly linear. It does not force a source parent id for every message.

Decision for this slice:

- Keep `source.externalParentId` required but allow `null`.
- Keep source identity generic as `source.key` and `source.fingerprint`.
- Widen `source.platform` to `"chatgpt" | "claude"`.
- Do not add Claude-specific fields to `CanonicalEvent`.

## TDD Notes

- Red: write model-pressure test from Claude shape.
- Green: alter canonical model only if Claude forces it.
- Refactor: source-specific details stay inside adapter boundary.
