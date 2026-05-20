# 009: Document Runnable MVP Loop

## Type

AFK.

## Blocked by

- [003: Resume Simple Continuation](003-resume-simple-continuation.md)
- [006: Forget Recent Entries](006-forget-recent-entries.md)

## What to build

Document the smallest runnable Host App loop: capture an Entry, resume a Continuation, forget recent capture.

The documentation should teach the domain language through working code, not a layer-by-layer architecture tour.

## First failing check

A README example can be copied into a smoke test and run:

```ts
const core = createContinuumCore({
  storage: createInMemoryStorage(),
  models: createDeterministicModels(),
  clock: systemClock(),
});

await core.ingest({
  body: "Need to quote Bob for the boiler.",
  captureContext: {
    capturedAt: systemClock().now(),
    clues: [],
  },
});

const brief = await core.resume(resumeRequest("Resume Bob boiler quote"));
await core.forget(forgetLastTenMinutes());
```

## Acceptance Criteria

- [ ] README includes install/link, build, test, and usage instructions.
- [ ] README snippet covers ingest, resume, and forget.
- [ ] README explains Entry, Capture Context, Context Clue, Continuation, and Resume Brief in lay terms.
- [ ] README states Host Apps own UI, microphone capture, auth, model credentials, and concrete persistence.
- [ ] README avoids stale terms `Stream`, `Continuation state`, `metadata`, and `Resume Pack`.
- [ ] Example code is either tested directly or mirrored by a smoke test.

## TDD Notes

- Red: turn the README-style example into a failing smoke test before polishing prose.
- Green: adjust docs/API examples until the smoke test passes.
- Keep philosophy docs as context; README should show the runnable loop.
