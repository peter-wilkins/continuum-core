# 002: Define Core Domain Types

## Goal

Add public TypeScript types for the first Continuum Core domain model.

## Acceptance Criteria

- Exports types for `Entry`, `EntryInput`, `CaptureContext`, `ContextClue`, `Confidence`, `Continuation`, `ContinuationLink`, `ResumeRequest`, `ResumeBrief`, `OpenThread`, `WorkingContext`, `ForgetRequest`, and `ForgottenEntry`.
- Public input types avoid optional fields unless omission is genuinely harmless and documented.
- `CaptureContext` is required on `EntryInput`.
- `ContextClue` includes kind, human-readable text, confidence, and observed time.
- `Confidence` is constrained to 0..1 through a constructor/helper.
- Domain type tests cover valid and invalid construction.

## Notes

- `Entry` content is immutable after creation, but an Entry can later be forgotten.
- Use glossary definitions from `CONTEXT.md` as source language.
