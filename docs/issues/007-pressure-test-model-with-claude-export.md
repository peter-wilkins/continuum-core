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

- [ ] Claude export docs or representative fixture shape are recorded.
- [ ] One Claude source record maps to canonical event fields.
- [ ] Any model gap is documented before implementation.
- [ ] ChatGPT-specific source graph assumptions are not baked into canonical fields.

## TDD Notes

- Red: write model-pressure test from Claude shape.
- Green: alter canonical model only if Claude forces it.
- Refactor: source-specific details stay inside adapter boundary.
