# 005: Handle Ambiguous Resume

## Type

AFK.

## Blocked by

- [003: Resume Simple Continuation](003-resume-simple-continuation.md)

## What to build

When a Resume Request could reasonably refer to multiple Continuations, return an honest low-confidence result with candidate explanations instead of pretending certainty.

## First failing test

Two plausible Continuations produce an ambiguous resume result:

```ts
await core.ingest(entry("Bob boiler quote needs materials check."));
await core.ingest(entry("Bob bathroom quote needs photos."));

const brief = await core.resume(resumeRequest("Resume Bob quote"));

expect(brief.confidence).toBeLessThan(0.7);
expect(brief.candidates.map((candidate) => candidate.name)).toContain("Bob boiler quote");
expect(brief.candidates.map((candidate) => candidate.name)).toContain("Bob bathroom quote");
```

## Acceptance Criteria

- [ ] Resume Brief can represent ambiguity without throwing.
- [ ] Candidate Continuations include names, reasons, and Confidence.
- [ ] Low-confidence ambiguity is visible in the public result.
- [ ] Exact or clearly stronger matches still return high Confidence.
- [ ] Tests cover ambiguous and non-ambiguous cases through public API.

## TDD Notes

- Red: write the ambiguous "Bob quote" test first.
- Green: add candidates and confidence thresholding only where needed.
- Do not build manual disambiguation UI; Host Apps decide presentation.
