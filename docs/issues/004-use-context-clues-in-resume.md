# 004: Use Context Clues In Resume

## Type

AFK.

## Blocked by

- [003: Resume Simple Continuation](003-resume-simple-continuation.md)

## What to build

Make Context Clues affect resume matching so sparse captured text can still resume the right Continuation.

This slice should treat Context Clues as evidence, not Entry content. The Resume Brief should explain when a clue helped a match.

## First failing test

Sparse text plus a clue can be resumed:

```ts
await core.ingest({
  body: "Need to check Tuesday.",
  captureContext: {
    capturedAt,
    clues: [
      contextClue({
        kind: "calendar",
        text: "Bob boiler quote",
        confidence: confidence(0.9),
        observedAt: capturedAt,
      }),
    ],
  },
});

const brief = await core.resume(resumeRequest("Resume Bob boiler"));

expect(brief.relevantEntries[0].reason).toContain("calendar");
```

## Acceptance Criteria

- [ ] Context Clue has kind, text, Confidence, and observed time.
- [ ] Resume matching considers clue text and clue Confidence.
- [ ] Resume Brief reasons distinguish body matches from clue matches.
- [ ] Clues do not replace or mutate Entry body.
- [ ] Tests cover body-sparse/clue-rich matching through public API.

## TDD Notes

- Red: write sparse-body clue match test first.
- Green: expand matching/ranking only enough for clue evidence.
- Keep clue kind open enough for Host Apps, but avoid `unknown` blobs in the public slice.
