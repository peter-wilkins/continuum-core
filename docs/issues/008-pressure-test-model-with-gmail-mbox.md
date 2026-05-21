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

- [x] MBOX/RFC source evidence is recorded.
- [x] Email message maps without pretending it is a chat message.
- [x] Sender/recipient identity pressure is documented.
- [x] Threading and quoted text are treated as model questions, not hidden parser details.

## Evidence

- RFC 4155 defines `application/mbox`: an mbox file is a sequence of Internet Message Format messages separated by `From ` lines.
- RFC 5322 defines email message headers/body. Useful fields for this slice: `Date`, `From`, `To`, `Cc`, `Bcc`, `Reply-To`, `Subject`, `Message-ID`, `In-Reply-To`, and `References`.
- RFC 5322 says reply messages should use `In-Reply-To` and `References`; `References` can identify a thread.
- Representative fixture: `src/fixtures/email-one-message.json`.

Sources:

- https://www.rfc-editor.org/rfc/rfc4155
- https://www.rfc-editor.org/rfc/rfc5322

## Model Pressure

Email is not a chat message. It forces:

- `source.platform` includes `"email"`.
- `participants` is required on every canonical event, with an empty array for sources that do not expose participants yet.
- `content.subject` is required as `string | null`; chat messages use `null`.
- Email threading maps source-level `In-Reply-To` to `source.externalParentId`.
- Email thread grouping maps first `References` id, or message id fallback, to `source.externalConversationId`.

Identity pressure:

- Email addresses are not people.
- One person can have many addresses.
- One address can represent a group, alias, company, or automated sender.
- The importer preserves addresses only; identity resolution stays outside this slice.

Threading and quoted text pressure:

- This slice does not strip quoted replies.
- Quoted text, MIME part selection, attachment extraction, and thread repair are explicit later model/parser questions.

## TDD Notes

- Red: write one-email normalization expectation.
- Green: add only model fields forced by email.
- Refactor: separate event content from relationship/participant model if needed.
