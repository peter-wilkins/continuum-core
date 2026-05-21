# 005: Export ChatGPT Conversations JSON To Event JSONL

## Type

AFK.

## Blocked by

- [004: Normalize ChatGPT Assistant and System Messages](004-normalize-chatgpt-assistant-and-system-messages.md)

## What to build

Read a tiny `conversations.json` fixture and write canonical event JSONL locally.

This proves the importer can process a real ChatGPT export shape while still staying local-only.

## First failing test

Given a fixture with one conversation containing two message nodes, `continuum-import chatgpt fixture.json --out events.jsonl` writes two canonical event lines.

## Acceptance Criteria

- [ ] CLI command accepts a ChatGPT `conversations.json` path.
- [ ] Output is newline-delimited canonical events.
- [ ] Output preserves source conversation and message ids.
- [ ] Raw export is not copied to any remote target.
- [ ] Fixture is tiny and contains no personal data.
- [ ] Test runs without network access.

## TDD Notes

- Red: write CLI/fixture behavior test before parser implementation.
- Green: support only the fixture shape needed for one conversation.
- Refactor: keep file IO at edge; normalization stays testable without CLI.
