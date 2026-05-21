# 014: Add Claude Quarantine, Batches, Inspect, Dry Run, And Preview

## Type

AFK.

## What to build

For the first real local Claude export, add the operational import loop around validation and normalization.

## Acceptance Criteria

- [x] Malformed Claude conversations are quarantined without dropping valid conversations.
- [x] Import result reports quarantine records.
- [x] Import batch model records source, file hash, status, and stats.
- [x] `continuum-import inspect claude <conversations.json>` reports counts without writing events.
- [x] `continuum-import dry-run claude <conversations.json> --out <preview.json>` writes a local preview.
- [x] Real local Claude sample can be inspected, dry-run, and imported twice idempotently.

## Notes

This is a Claude-first vertical slice. ChatGPT remains postponed until a real export arrives.

The preview is intentionally small:

- batch
- report
- quarantine
- event summaries

Later preview work should add sensitivity candidates, provenance grouping, timeline density, people/entities/projects, and membrane decisions.
