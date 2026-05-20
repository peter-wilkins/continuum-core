# 003: Resume Simple Continuation

## Type

AFK.

## Blocked by

- [002: Capture First Entry](002-capture-first-entry.md)

## What to build

Let a Host App resume a simple Continuation after capturing related Entries.

This slice should introduce the minimum Continuation, Continuation Link, Resume Request, Resume Brief, and deterministic matching behavior needed for one obvious case.

## First failing test

Through the public API, two related Entries can be resumed together:

```ts
await core.ingest(entry("Bob asked for a boiler quote."));
await core.ingest(entry("Need to check Tuesday availability for Bob."));

const brief = await core.resume(resumeRequest("Resume Bob boiler quote"));

expect(brief.summary).toContain("Bob");
expect(brief.relevantEntries).toHaveLength(2);
expect(brief.confidence).toBeGreaterThan(0.7);
```

## Acceptance Criteria

- [ ] `resume` accepts a required Resume Request object.
- [ ] Related Entries can produce one inferred Continuation.
- [ ] Resume Brief includes selected Continuation, summary, relevant Entries, reasons, Confidence, and generation time.
- [ ] Matching works deterministically without network or model credentials.
- [ ] Test proves a Host App can capture then resume through public API only.
- [ ] No proactive always-searching API is introduced yet.

## TDD Notes

- Red: write the two-entry resume test first.
- Green: add only enough Continuation/link/resume behavior to pass the obvious case.
- Keep ranking crude until a later test forces nuance.
