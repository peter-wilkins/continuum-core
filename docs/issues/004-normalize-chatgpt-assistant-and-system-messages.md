# 004: Normalize ChatGPT Assistant and System Messages

## Status

Done.

## Type

AFK.

## Blocked by

- [003: Normalize One ChatGPT User Message](003-normalize-one-chatgpt-user-message.md)

## What to build

Extend ChatGPT normalization beyond user messages so assistant, system, and tool messages become canonical events without losing actor role or provenance.

## First failing test

A user message and assistant response from the same conversation normalize into separate events with different actor roles and linked source graph references.

## Acceptance Criteria

- [x] Assistant messages normalize into canonical events.
- [x] System and tool roles are preserved or explicitly mapped.
- [x] Source graph references can link message source ids before canonical event ids are known.
- [x] Canonical event actor model is not user-only.
- [x] Tests cover at least user and assistant roles through the same normalization path.

## TDD Notes

- Red: add one assistant-message test after user-message test passes.
- Green: widen actor handling only enough for ChatGPT roles.
- Refactor: extract actor mapping when duplication appears.
