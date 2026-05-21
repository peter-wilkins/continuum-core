# 047: Parse One MBOX Email

Status: ready

## Type

AFK.

## What to build

Add a minimal MBOX/RFC 5322 parser that converts one raw email message into the existing `EmailMessageNormalizationInput`, then normalize it into the canonical event model.

Use `src/fixtures/email-one-message.json` as the expected structured shape. If `data/email/rfc-style-example.mbox` exists locally, use it as source evidence; otherwise create a small committed RFC-style fixture with no secrets.

## First failing test

`parses one MBOX email into the existing email normalization input`

## Acceptance Criteria

- [ ] Add a committed raw MBOX/RFC-style email fixture.
- [ ] Parse `Message-ID`, `Date`, `From`, `To`, `Cc`, `Bcc`, `Reply-To`, `Subject`, `In-Reply-To`, and `References`.
- [ ] Parse a plain text body.
- [ ] Preserve unrecognized headers in `headers`.
- [ ] Return validation errors instead of throwing for missing required fields.
- [ ] Normalize the parsed message with the existing `normalizeEmailMessage`.
- [ ] Do not strip quoted replies in this slice.
- [ ] Do not implement MIME attachment extraction in this slice.

## Blocked by

None - can start immediately.

## Notes

Keep parser conservative. One plain text message is enough. MIME multipart, HTML, attachments, Gmail labels, and quote stripping are later slices.
