# 061: Identity-First Public Import Scope

Status: done

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
- optional focus identity
- allowed source families
- license/publicness expectation
- provenance rules

## What To Build

Add the first core representation of an **Import Scope** for public identity/topic imports.

This is a model and test slice, not a complete public web crawler.

## First Failing Test

`defines an identity-first public import scope for Ada Lovelace about computing`

## Acceptance Criteria

- [x] Define a public `ImportScope` type.
- [x] Scope requires a primary identity target.
- [x] Scope requires source-family allowlist, even if it contains only one source.
- [x] Scope requires publicness/license intent rather than assuming all sources are safe.
- [x] Scope supports a required focus identity field represented explicitly as an entity or `null`.
- [x] Scope can represent `Ada Lovelace` through `computing`.
- [x] Scope can represent identity aliases without resolving them into one hidden string.
- [x] Scope can be serialized in preview/import batch metadata.
- [x] Existing private importers do not need to implement this immediately.

## Out Of Scope

- Fetching Wikidata/Wikipedia/Wikisource data.
- Ranking public sources.
- Entity resolution.
- LLM topic filtering.
- User-facing import UI.
- Personal Google/Claude/Email importer changes.

## Notes

Use public data first because it is easier to demo, easier to share, easier to test, and safer for early feedback loops.

Do not silently discard records that fail a focus identity filter. They should become excluded or needs-review evidence with reasons, not disappear.

Implementation notes:

- `focusEntity` replaces earlier topic-filter language because entities can be people, topics, works, places, events, or concepts.
- Existing private import batches serialize `importScope: null`.
