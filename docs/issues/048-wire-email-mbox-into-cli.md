# 048: Wire Email MBOX Into CLI

Status: ready

## Type

AFK.

## What to build

Make raw MBOX email imports usable through `continuum-import`.

## First failing test

`imports one MBOX email through the CLI`

## Acceptance Criteria

- [ ] CLI accepts `email-mbox`.
- [ ] CLI imports the committed MBOX fixture into JSONL.
- [ ] CLI dry-run writes a preview with one email event.
- [ ] Malformed MBOX input quarantines instead of throwing.
- [ ] Folder/zip routing detects `.mbox` files.
- [ ] CLI usage docs mention `email-mbox`.

## Blocked by

- [047: Parse One MBOX Email](047-parse-one-mbox-email.md)

## Notes

Do not add Gmail-specific filtering here. Import profiles already exist at the normalized email-message level.
