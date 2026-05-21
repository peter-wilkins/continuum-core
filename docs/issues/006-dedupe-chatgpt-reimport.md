# 006: Dedupe ChatGPT Reimport

## Type

AFK.

## Blocked by

- [005: Export ChatGPT Conversations JSON To Event JSONL](005-export-chatgpt-conversations-json-to-event-jsonl.md)

## What to build

Importing the same ChatGPT export twice should report known events instead of duplicating canonical events.

## First failing test

Running the same fixture import twice produces one event set and a second-run report with zero new events.

## Acceptance Criteria

- [ ] Import computes a stable source key or fingerprint for each ChatGPT message.
- [ ] Reimport recognizes identical source records.
- [ ] Reimport report distinguishes new, known, changed, and uncertain records.
- [ ] No canonical event is silently overwritten.
- [ ] Test proves two runs do not duplicate events.

## TDD Notes

- Red: write repeated-import test.
- Green: add the smallest identity/fingerprint mechanism needed.
- Refactor: do not implement fuzzy dedupe until a later source forces it.
