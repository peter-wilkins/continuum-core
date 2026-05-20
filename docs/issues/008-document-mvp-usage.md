# 008: Document MVP Usage

## Goal

Document how a TypeScript Host App uses the first iteration of Continuum Core.

## Acceptance Criteria

- README includes install/link, build, test, and minimal usage example.
- Example shows `createContinuumCore`, in-memory storage, deterministic model fallback, `ingest`, `resume`, and `forget`.
- Docs explain `Entry`, `Capture Context`, `Context Clue`, `Continuation`, and `Resume Brief` in lay terms.
- Docs state core does not own UI, microphone capture, auth, model credentials, or concrete persistence.
- Docs avoid stale terms `Stream`, `Continuation state`, `metadata`, and `Resume Pack`.

## Notes

- Keep docs API-first and library-first.
- Existing philosophy docs remain product context, not implementation contract.
