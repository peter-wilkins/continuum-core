# 051: Return Continuation Candidates From Deterministic Retrieval

Status: done

## Type

AFK.

## Parent

Epic 2 — Continuity Retrieval.

## What to build

Implement the **Retrieval Tracer Bullet**: given Imported Entries and a **Resume Request**, return ranked **Continuation Candidates** using the **Deterministic Retrieval Baseline**. The first rankings do not need to be good; they need to be inspectable and repeatable.

## First failing test

`returns ranked Continuation Candidates for a Resume Request`

## Acceptance Criteria

- [x] Accept a Resume Request and a small set of Imported Entries.
- [x] Return a ranked list of Continuation Candidates.
- [x] Use deterministic Ranking Signals such as text overlap, recency, recurrence, and explicit cues.
- [x] Include Retrieval Confidence as bounded 0..1 evidence strength.
- [x] Return multiple candidates when multiple Continuations plausibly match.
- [x] Do not require embeddings or model calls.

## Blocked by

- [050: Create Imported Entries From Canonical Events](050-create-imported-entries-from-canonical-events.md)

## Notes

This is pipeline-first. A bad but explainable ranking is acceptable for this slice.
