# 007: Implement Forget Request

## Goal

Implement privacy-preserving forgetting across the Source Log and derived Memory Layer.

## Acceptance Criteria

- `createContinuumCore(...).forget(request)` accepts a `ForgetRequest`.
- Supports at least recent-duration forgetting, such as “last 10 minutes”.
- Forgotten Entries are unavailable for retrieval, Continuation linking, and Resume Briefs.
- Derived summaries/links/rankings are removed or rebuilt so forgotten content cannot reappear.
- Minimal non-content tombstones can remain to prevent accidental resurrection.
- Tests prove forgotten Entry text does not appear in resume output.

## Notes

- Forgetting must not mean hide/archive/dismiss.
- Preserve privacy over analytics convenience.
