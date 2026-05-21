# 053: Return Ambiguous Resume Surface

Status: done

## Type

AFK.

## Parent

Epic 2 — Continuity Retrieval.

## What to build

When **Candidate Spread** is narrow, return an **Ambiguous Resume Surface** that leads with the strongest **Continuation Candidate** while preserving alternates for inspection.

## First failing test

`returns top Continuation Candidate with alternates when Candidate Spread is narrow`

## Acceptance Criteria

- [x] Detect a narrow Candidate Spread between ranked candidates.
- [x] Return the strongest candidate first.
- [x] Include alternate candidates rather than hiding them.
- [x] Preserve many candidates in debug output.
- [x] Do not force a single Continuation when evidence is close.
- [x] Tests cover both narrow spread and clear winner cases.

## Blocked by

- [052: Include Link Reasons And Signal Evidence Trails](052-include-link-reasons-and-signal-evidence-trails.md)

## Notes

The user-facing surface can be simple later. The core result should keep enough data for debugging.
