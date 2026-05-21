# 009: Pressure Test Model With Wikimedia

## Type

HITL.

## Blocked by

- [003: Normalize One ChatGPT User Message](003-normalize-one-chatgpt-user-message.md)

## What to build

Use Wikimedia/Wikipedia/Wikidata to stress the model at large public-knowledge scale.

Wikimedia should be treated as a source family: MediaWiki page revisions, page metadata, links/categories, Wikidata entities/claims, and analytics/pageviews are different record types.

## First failing test

One MediaWiki page revision normalizes into canonical event shape with actor, timestamp, artifact/page reference, revision id, comment, content reference, and provenance.

## Acceptance Criteria

- [ ] Wikimedia source family is split into concrete schema targets.
- [ ] Page revision maps as an event without forcing conversation/message terminology.
- [ ] Wikidata entity/claim model pressure is noted separately from page revision pressure.
- [ ] Pageview analytics are identified as aggregate events, not content events.
- [ ] Scale implications are recorded but not optimized prematurely.

## TDD Notes

- Red: write one page-revision normalization expectation.
- Green: adjust canonical model only where page revisions force it.
- Refactor: avoid making Wikimedia special; use it to reveal missing primitives.
