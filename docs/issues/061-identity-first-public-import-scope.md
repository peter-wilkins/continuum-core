# 061: Identity-First Public Import Scope

Status: ready

## Type

AFK.

## Context

MVP direction has changed.

The first public MVP should not be a private personal Continuum. It should be a Continuum about extended thought, seeded from public data, so people can explore the app and give useful feedback while the product learns what it wants to be.

Private importers still matter, but they are no longer the fastest path to a demoable MVP.

New import shape:

```text
Import Ada Lovelace into this Continuum.
Import everything Ada Lovelace said about computers.
```

That implies an import must start with an explicit scope:

- target identity
- optional topic filter
- allowed source families
- license/publicness expectation
- provenance rules

## What To Build

Add the first core representation of an **Import Scope** for public identity/topic imports.

This is a model and test slice, not a complete public web crawler.

## First Failing Test

`defines an identity-first public import scope for Ada Lovelace about computing`

## Acceptance Criteria

- [ ] Define a public `ImportScope` type.
- [ ] Scope requires an identity target.
- [ ] Scope requires source-family allowlist, even if it contains only one source.
- [ ] Scope requires publicness/license intent rather than assuming all sources are safe.
- [ ] Scope supports a required topic filter field represented explicitly as a string or `null`.
- [ ] Scope can represent `Ada Lovelace` with topic `computing`.
- [ ] Scope can represent identity aliases without resolving them into one hidden string.
- [ ] Scope can be serialized in preview/import batch metadata.
- [ ] Existing private importers do not need to implement this immediately.

## Out Of Scope

- Fetching Wikidata/Wikipedia/Wikisource data.
- Ranking public sources.
- Entity resolution.
- LLM topic filtering.
- User-facing import UI.
- Personal Google/Claude/Email importer changes.

## Notes

Use public data first because it is easier to demo, easier to share, easier to test, and safer for early feedback loops.

Do not silently discard records that fail a topic filter. They should become excluded or needs-review evidence with reasons, not disappear.
