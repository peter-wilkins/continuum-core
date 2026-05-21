# 050: Create Imported Entries From Canonical Events

Status: ready

## Type

AFK.

## Parent

Epic 2 — Continuity Retrieval.

## What to build

Create the first path from imported **Canonical Events** into **Imported Entries** in the **Source Log** shape used by retrieval. The slice should prove that import-normalized records can become retrieval-ready Entries without retrieval depending on vendor/source-specific event shapes.

## First failing test

`creates Imported Entries from Canonical Events`

## Acceptance Criteria

- [ ] Add an `ImportedEntry` type or equivalent Entry shape that follows `CONTEXT.md`.
- [ ] Convert at least one existing Canonical Event fixture into an Imported Entry.
- [ ] Preserve source identity and provenance from the Canonical Event.
- [ ] Preserve content, created time, and explicit absence values.
- [ ] Do not make retrieval code depend directly on source-specific Canonical Event fields.
- [ ] Add tests that show Imported Entries are stable inputs for later Continuity Retrieval.

## Blocked by

None - can start immediately.

## Notes

Quality is not the goal here. This is the handoff from Epic 1 import ingestion into Epic 2 retrieval.
