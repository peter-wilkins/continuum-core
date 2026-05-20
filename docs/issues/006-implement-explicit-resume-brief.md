# 006: Implement Explicit Resume Brief

## Goal

Allow a Host App to ask Continuum Core to resume an ongoing Continuation and receive a useful Resume Brief.

## Acceptance Criteria

- `createContinuumCore(...).resume(request)` accepts a `ResumeRequest`.
- Natural-language request text such as `Resume boiler quote` or `Re kitchen redesign` can match likely Continuations.
- Result includes selected Continuation identity/name, summary, relevant Entries with reasons, Open Threads, Confidence, and generated time.
- Resume ranking uses available Entry text, Context Clues, Continuation Links, recency, and deterministic model fallback.
- Tests cover exact match, fuzzy match, low-confidence ambiguity, and no useful match.
- Result does not include Forgotten Entries.

## Notes

- Explicit resume is first iteration. Proactive always-searching APIs can follow after this vertical slice works.
