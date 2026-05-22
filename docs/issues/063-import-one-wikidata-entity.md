# 063: Import One Wikidata Entity

Status: done

## Type

AFK.

## Context

The public MVP starts identity-first. The first useful public seed is an entity record for Ada Lovelace, because Wikidata gives stable ids, labels, aliases, descriptions, and source-family provenance.

## What Was Built

Import one Wikidata EntityData JSON record into the canonical event model.

## First Failing Test

`imports one Wikidata entity into the canonical event model`

## Acceptance Criteria

- [x] Add a strict `WikidataEntityNormalizationInput` source shape.
- [x] Normalize one Wikidata entity snapshot into one `CanonicalEvent`.
- [x] Preserve Wikidata id, revision id, modified time, label, description, and aliases.
- [x] Mark provenance as `sourceFamily=wikimedia`, `sourceName=wikidata`, `upstreamSources=[wikimedia]`.
- [x] License the source event as `CC0`.
- [x] Wire `wikidata-entity` into the import CLI.
- [x] Keep Wikipedia and Wikidata from counting as independent evidence by default.

## Out Of Scope

- Fetching live Wikidata from the CLI.
- Importing multiple entities in one file.
- Claim graph expansion.
- Focus-identity filtering.
- Wikisource text import.

## Notes

Fixture source shape follows Wikidata EntityData for Q7259, Ada Lovelace.
