# 054: Add Debug Ranking Profiles

Status: ready

## Type

AFK.

## Parent

Epic 2 — Continuity Retrieval.

## What to build

Add debug-only **Ranking Profiles** so QA and user testing can compare different **Ranking Signal** weightings against the same Resume Request and Imported Entries.

## First failing test

`compares Continuation Candidate rankings across Ranking Profiles`

## Acceptance Criteria

- [ ] Define named Ranking Profiles for debug/QA use.
- [ ] Include at least a balanced profile and one profile that changes ranking order.
- [ ] Run the same Resume Request through multiple profiles.
- [ ] Return enough profile metadata to inspect which weighting was used.
- [ ] Do not expose Ranking Profiles as normal user-facing controls.
- [ ] Tests prove deterministic profile comparison.

## Blocked by

- [052: Include Link Reasons And Signal Evidence Trails](052-include-link-reasons-and-signal-evidence-trails.md)

## Notes

Useful starter profiles: balanced, semantic-heavy, recency-heavy, recurrence-heavy, explicit-cue-heavy.
