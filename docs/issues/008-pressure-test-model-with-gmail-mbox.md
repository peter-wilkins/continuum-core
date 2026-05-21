# 008: Pressure Test Model With Gmail MBOX

## Type

HITL.

## Blocked by

- [003: Normalize One ChatGPT User Message](003-normalize-one-chatgpt-user-message.md)

## What to build

Use email/MBOX to stress the canonical model with threads, headers, quoting, attachments, MIME parts, and identity aliases.

## First failing test

One RFC-style email message normalizes into canonical event shape with actor, recipients as relations or participants, timestamp, subject, body, and source provenance.

## Acceptance Criteria

- [ ] MBOX/RFC source evidence is recorded.
- [ ] Email message maps without pretending it is a chat message.
- [ ] Sender/recipient identity pressure is documented.
- [ ] Threading and quoted text are treated as model questions, not hidden parser details.

## TDD Notes

- Red: write one-email normalization expectation.
- Green: add only model fields forced by email.
- Refactor: separate event content from relationship/participant model if needed.
