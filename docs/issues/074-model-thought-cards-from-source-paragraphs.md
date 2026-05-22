# 074: Model Thought Cards From Source Paragraphs

Status: ready

## Type

AFK.

## Context

The public MVP should show small Thought Cards rather than document-like pages. A Thought Card is a rebuildable materialized view over source truth, with stable generated display text and required provenance.

## What to build

Add the MVP Thought Card domain model and constructor validation.

Accepted shape:

```ts
type ThoughtCard = {
  id: ThoughtCardId;
  lensOutputId: LensOutputId;
  title: HumanText;
  body: HumanText;
  sourceParagraphIds: NonEmptyArray<SourceParagraphId>;
  confidence: Confidence;
  generatedAt: KnowledgeTime;
};
```

## First failing test

`creates one Thought Card from Source Paragraph references`

## Acceptance Criteria

- [ ] Export the `ThoughtCard` model and constructor/validator.
- [ ] Require non-blank generated title and body.
- [ ] Require one or more Source Paragraph ids.
- [ ] Require a Lens output id.
- [ ] Require Confidence.
- [ ] Require Knowledge Time for generation time.
- [ ] Do not duplicate scope id, query id, Lens id, or Source Paragraph locator data on the Thought Card.
- [ ] Reject a Thought Card with no Source Paragraph ids.

## Blocked by

- [072: Model Source Paragraph Records](072-model-source-paragraph-records.md)

## Out Of Scope

- Generating cards from source text.
- UI rendering.
- Persisting cards.
- Feedback/voting changes.
