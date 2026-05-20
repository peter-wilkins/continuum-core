# 007: Prevent Forgotten Content Resurrection

## Type

AFK.

## Blocked by

- [006: Forget Recent Entries](006-forget-recent-entries.md)

## What to build

Make forgetting durable across rebuilds, new core instances, and reranking so deleted content cannot reappear from derived memory.

## First failing test

Forgetting remains effective after the core is recreated against the same storage:

```ts
const storage = createInMemoryStorage();
const firstCore = createContinuumCore({ storage, clock });

await firstCore.ingest(entry("Bob boiler quote is 900 pounds."));
await firstCore.forget(forgetLastTenMinutes());

const secondCore = createContinuumCore({ storage, clock });
const brief = await secondCore.resume(resumeRequest("Resume Bob boiler quote"));

expect(JSON.stringify(brief)).not.toContain("900 pounds");
expect(await secondCore.getEntry(originalEntryId)).toBeNull();
```

## Acceptance Criteria

- [ ] Forgotten Entry tombstones contain no Entry body or Context Clue text.
- [ ] Recreating the core with the same storage does not restore forgotten content.
- [ ] Rebuilding or recomputing Continuation Links skips Forgotten Entries.
- [ ] Resume Brief output contains no forgotten body, clue text, summary text, or reason text.
- [ ] Tests verify durability through public API and storage boundary only.

## TDD Notes

- Red: write recreate-core-after-forget test.
- Green: add minimal non-content tombstone/rebuild guard.
- Treat privacy failure as higher severity than ranking quality.
