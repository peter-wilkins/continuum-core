# 055: Record Retrieval Feedback Signals

Status: done

## Type

AFK.

## Parent

Epic 2 — Continuity Retrieval.

## What to build

Record **Feedback Signals** for a **Retrieval Feedback Loop**. Explicit user corrections may update ranking/link state immediately; behavioural and model-assisted signals should be retained as inspectable evidence first.

## First failing test

`records Feedback Signals for a Retrieval Feedback Loop`

## Acceptance Criteria

- [x] Add Feedback Signal records for explicit corrections, behavioural signals, and model-assisted critique.
- [x] Preserve the related Resume Request, Continuation Candidate, and supporting Entry references.
- [x] Explicit user correction can strengthen/weaken or reject a Continuation Link.
- [x] Behavioural and model-assisted signals are recorded without being treated as truth.
- [x] Feedback Signals are inspectable for debugging.
- [x] Tests cover explicit correction and model-assisted critique as different signal types.

## Blocked by

- [052: Include Link Reasons And Signal Evidence Trails](052-include-link-reasons-and-signal-evidence-trails.md)

## Notes

Model-assisted critique is evidence to inspect, not an authority.
