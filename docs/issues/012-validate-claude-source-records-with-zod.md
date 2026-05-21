# 012: Validate Claude Source Records With Zod

## Type

AFK.

## What to build

Use Zod at the source-adapter boundary for Claude exports before normalization.

ChatGPT remains postponed until its export arrives. Claude is the first real personal export shape available locally.

## First failing test

A malformed Claude conversation returns readable validation errors with source paths instead of reaching the normalizer.

## Acceptance Criteria

- [x] Zod is installed.
- [x] Claude export JSON validates before normalization.
- [x] Malformed Claude records return path/message errors.
- [x] Claude `parent_message_uuid` is preserved as `source.externalParentId`.
- [x] CLI supports `continuum-import claude <conversations.json> --out <events.jsonl>`.
- [x] Real local Claude sample imports twice with zero duplicates on the second run.

## Notes

Zod belongs at the adapter boundary. Canonical event types remain TypeScript types.

Validation should reject malformed source records early and explain where the source shape failed. Later slices can add quarantine output instead of failing the whole CLI command.
