# 047: Parse One MBOX Email

Status: done

## Type

AFK.

## What to build

Add a minimal MBOX/RFC 5322 parser that converts one raw email message into the existing `EmailMessageNormalizationInput`, then normalize it into the canonical event model.

Use `src/fixtures/email-one-message.json` as the expected structured shape. If `data/email/rfc-style-example.mbox` exists locally, use it as source evidence; otherwise create a small committed RFC-style fixture with no secrets.

## First failing test

`parses one MBOX email into the existing email normalization input`

## Acceptance Criteria

- [x] Add a committed raw MBOX/RFC-style email fixture.
- [x] Parse `Message-ID`, `Date`, `From`, `To`, `Cc`, `Bcc`, `Reply-To`, `Subject`, `In-Reply-To`, and `References`.
- [x] Parse a plain text body.
- [x] Preserve unrecognized headers in `headers`.
- [x] Return validation errors instead of throwing for missing required fields.
- [x] Normalize the parsed message with the existing `normalizeEmailMessage`.
- [x] Do not strip quoted replies in this slice.
- [x] Do not implement MIME attachment extraction in this slice.

## Blocked by

None - can start immediately.

## Notes

Implemented with `mailparser` for RFC/MIME decoding and a conservative MBOX splitter. Attachments are counted, not extracted. Gmail labels and quote stripping remain later slices.
