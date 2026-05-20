# 005: Implement Ingest and Continuation Linking

## Goal

Implement the first vertical slice from Entry input to stored Entry and inferred Continuation relationships.

## Acceptance Criteria

- `createContinuumCore({ storage, models, clock })` exposes `ingest(input)`.
- `ingest` validates required Entry input and Capture Context.
- `ingest` stores immutable Entry content in the Source Log.
- `ingest` creates or updates inferred Continuations.
- `ingest` creates Continuation Links with bounded Confidence and explainable reasons.
- One Entry can link to multiple Continuations.
- Tests cover new Continuation creation, linking to existing Continuation, and ambiguous multi-link cases.

## Notes

- No manual folders/projects/threads.
- No raw audio handling in core; Host Apps provide text.
