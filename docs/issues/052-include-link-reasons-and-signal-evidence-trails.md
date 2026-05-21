# 052: Include Link Reasons And Signal Evidence Trails

Status: ready

## Type

AFK.

## Parent

Epic 2 — Continuity Retrieval.

## What to build

Make each **Continuation Candidate** explainable by attaching supporting Entries, **Link Reasons**, and a **Signal Evidence Trail**. This should support debugging and future **Continuity Maps**.

## First failing test

`explains why Entries support a Continuation Candidate`

## Acceptance Criteria

- [ ] Each Continuation Candidate includes supporting Entries.
- [ ] Each supporting Entry includes at least one Link Reason.
- [ ] Each candidate exposes the Ranking Signals that contributed to Retrieval Confidence.
- [ ] Signal Evidence Trail is retained in the result, not thrown away after scoring.
- [ ] Reasons are human-readable enough for debugging.
- [ ] Tests assert reason text for deterministic cases.

## Blocked by

- [051: Return Continuation Candidates From Deterministic Retrieval](051-return-continuation-candidates-from-deterministic-retrieval.md)

## Notes

Avoid opaque scores. Reasons can be simple: matching terms, recency, repeated topic, explicit cue.
