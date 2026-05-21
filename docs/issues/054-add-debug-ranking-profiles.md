# 054: Add Debug Ranking Profiles

Status: done

## Type

AFK.

## Parent

Epic 2 — Continuity Retrieval.

## What to build

Add debug-only **Ranking Profiles** so QA and user testing can compare different **Ranking Signal** weightings against the same Resume Request and Imported Entries.

## First failing test

`compares Continuation Candidate rankings across Ranking Profiles`

## Acceptance Criteria

- [x] Define named Ranking Profiles for debug/QA use.
- [x] Include at least a balanced profile and one profile that changes ranking order.
- [x] Run the same Resume Request through multiple profiles.
- [x] Return enough profile metadata to inspect which weighting was used.
- [x] Do not expose Ranking Profiles as normal user-facing controls.
- [x] Tests prove deterministic profile comparison.

## Blocked by

- [052: Include Link Reasons And Signal Evidence Trails](052-include-link-reasons-and-signal-evidence-trails.md)

## Notes

Useful starter profiles: balanced, semantic-heavy, recency-heavy, recurrence-heavy, explicit-cue-heavy.
