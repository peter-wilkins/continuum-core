# 048: Wire Email MBOX Into CLI

Status: in_progress

## Type

AFK.

## What to build

Make raw MBOX email imports usable through `continuum-import`.

## First failing test

`imports one MBOX email through the CLI`

## Acceptance Criteria

- [x] CLI accepts `email-mbox`.
- [x] CLI imports the committed MBOX fixture into JSONL.
- [x] CLI dry-run writes a preview with one email event.
- [x] Malformed MBOX input quarantines instead of throwing.
- [ ] Folder/zip routing detects `.mbox` files.
- [x] CLI usage docs mention `email-mbox`.

## Blocked by

- [047: Parse One MBOX Email](047-parse-one-mbox-email.md)

## Notes

Do not add Gmail-specific filtering here. Import profiles already exist at the normalized email-message level.

Direct `email-mbox` import is implemented. Folder/zip `.mbox` routing remains open because real Takeout mailboxes can be multi-GB and must use the streaming path rather than the archive reader's current whole-file loading.
