# 002: Capture First Entry

## Type

AFK.

## Blocked by

- [001: Scaffold TypeScript Library](001-scaffold-typescript-library.md)

## What to build

Give a Host App the smallest useful path through Continuum Core: submit one captured thought with required Capture Context and receive a stored Entry with core-owned identity.

This slice should create only the types, store behavior, and facade needed for this path. Do not prebuild the full domain model.

## First failing test

Through the public API, a Host App can ingest one Entry:

```ts
const core = createContinuumCore({
  storage: createInMemoryStorage(),
  clock: fixedClock("2026-05-21T09:00:00.000Z"),
});

const entry = await core.ingest({
  body: "Need to quote Bob for the boiler.",
  captureContext: {
    capturedAt: instant("2026-05-21T08:59:00.000Z"),
    clues: [],
  },
});

expect(entry.body).toBe("Need to quote Bob for the boiler.");
expect(entry.id).toBeDefined();
expect(await core.getEntry(entry.id)).toEqual(entry);
```

## Acceptance Criteria

- [ ] `createContinuumCore` is exported from `src/index.ts`.
- [ ] `ingest` accepts Entry body plus required Capture Context.
- [ ] `ingest` returns an Entry with a core-owned id.
- [ ] Entry content is stored and retrievable through a public API.
- [ ] Capture Context includes captured time and an explicit `clues` array, even when empty.
- [ ] Public input types avoid optional fields and silent defaults.
- [ ] Tests use public API only.

## TDD Notes

- Red: write the single-entry ingest test first.
- Green: add the smallest domain types, in-memory storage, clock helper, and facade needed to pass.
- Refactor only after the behavior passes.
