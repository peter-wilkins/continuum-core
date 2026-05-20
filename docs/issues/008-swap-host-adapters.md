# 008: Swap Host Adapters

## Type

AFK.

## Blocked by

- [003: Resume Simple Continuation](003-resume-simple-continuation.md)
- [004: Use Context Clues In Resume](004-use-context-clues-in-resume.md)

## What to build

Prove Continuum Core is a library, not an app runtime, by running the same capture/resume behavior with Host App supplied storage and model adapters.

## First failing test

The same public behavior works with fake Host App adapters:

```ts
const core = createContinuumCore({
  storage: new FakeHostStorage(),
  models: new FakeHostModels(),
  clock,
});

await core.ingest(entry("Bob boiler quote"));
const brief = await core.resume(resumeRequest("Resume Bob boiler"));

expect(brief.relevantEntries).toHaveLength(1);
```

## Acceptance Criteria

- [ ] `StorageAdapter` interface is exported only when a Host App adapter test needs it.
- [ ] `ModelAdapter` interface is exported only when a Host App adapter test needs it.
- [ ] In-memory and fake Host App adapters produce equivalent capture/resume behavior.
- [ ] Core does not import DB, UI, microphone, auth, or network provider packages.
- [ ] Tests exercise behavior through `createContinuumCore`, not adapter internals.

## TDD Notes

- Red: write adapter-swap behavior test against fake adapters.
- Green: extract only the adapter interfaces forced by the test.
- Keep default deterministic adapters available for prototypes and CI.
