# 075: Create Default Public Thought Cards

Status: ready

## Type

AFK.

## Context

The MVP already creates default public Lens outputs, but those outputs are still document/event shaped. The next usable slice should produce Thought Cards from Source Paragraphs so the app can render small source-backed thoughts.

## What to build

Add a deterministic helper that creates ordered public MVP Thought Cards for a Lens output from Source Paragraphs.

## First failing test

`creates default public Thought Cards from Source Paragraphs`

## Acceptance Criteria

- [ ] Create Thought Cards for one Lens output from one or more Source Paragraphs.
- [ ] Preserve the Lens output id on every Thought Card.
- [ ] Store generated title and body as rebuildable display text.
- [ ] Require at least one Source Paragraph id per card.
- [ ] Return cards in stable display order.
- [ ] Generate stable card ids for unchanged Lens output and Source Paragraph input.
- [ ] Do not add source paragraph locator data directly to Thought Cards.
- [ ] Do not call an LLM in this deterministic MVP helper.

## Blocked by

- [073: Extract Source Paragraphs From Public Documents](073-extract-source-paragraphs-from-public-documents.md)
- [074: Model Thought Cards From Source Paragraphs](074-model-thought-cards-from-source-paragraphs.md)

## Out Of Scope

- UI rendering.
- Persisting card order.
- User feedback changes.
- LLM-generated card synthesis.
