# 006: Forget Recent Entries

## Type

AFK.

## Blocked by

- [003: Resume Simple Continuation](003-resume-simple-continuation.md)

## What to build

Let a Host App honor a user instruction like "Forget last 10 minutes" so recent Entries stop appearing in resume behavior.

## First failing test

Forgetting recent capture removes it from future resume:

```ts
await core.ingest(entryAt("2026-05-21T10:00:00.000Z", "Bob boiler quote is 900 pounds."));

await core.forget({
  scope: "recent-duration",
  requestedAt: instant("2026-05-21T10:05:00.000Z"),
  durationMs: 10 * 60_000,
});

const brief = await core.resume(resumeRequest("Resume Bob boiler quote"));

expect(JSON.stringify(brief)).not.toContain("900 pounds");
```

## Acceptance Criteria

- [ ] `forget` accepts an explicit Forget Request object.
- [ ] Recent-duration scope is supported.
- [ ] Forgotten Entries are unavailable to `getEntry`.
- [ ] Forgotten Entry content is absent from Resume Brief summaries, relevant Entries, reasons, and candidates.
- [ ] Forgetting cleans or invalidates derived Continuation Links for forgotten Entries.
- [ ] Test proves forgotten text cannot be surfaced through public resume behavior.

## TDD Notes

- Red: write one sensitive Entry, forget it, then resume.
- Green: implement minimum forget path across stored Entries and derived links.
- Do not keep content in tombstones.
