# 011: Add Provenance Metadata To Events

## Type

AFK.

## What to build

Every imported event needs provenance at ingestion time so later consensus/evidence weighting does not double-count derived data.

## First failing test

Two records from the same upstream lineage, such as Wikipedia and DBpedia, count as one independent evidence line.

## Acceptance Criteria

- [x] `CanonicalEvent` has required provenance metadata.
- [x] Existing importers fill provenance.
- [x] Source catalogue records provenance family and overlap warnings.
- [x] Evidence counting uses upstream lineage, not content-hash dedupe.
- [x] Test proves same-lineage Wikimedia/DBpedia-style records do not count independently.

## Notes

Content hash dedupe is too brittle for consensus. Same fact can be phrased differently, and same text can be quoted through many channels.

Use lineage instead:

- `sourceFamily`: broad evidence family.
- `sourceName`: direct source imported.
- `upstreamSources`: known sources behind the direct source.
- `derivedFrom`: explicit derivation markers.
- `retrievedAt`: import retrieval time, or `unknown` for fixtures.
- `license`: source license where known.

Rule:

> Never treat two records as independent unless their upstream lineage differs.
