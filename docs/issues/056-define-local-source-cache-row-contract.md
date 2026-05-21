# 056: Define Local Source Cache Row Contract

Status: done

## Type

AFK.

## Parent

Importer local serving path.

## What to build

Define the Continuum Core contract for a **Local Source Cache** row without taking a SQLite dependency. The Host App owns the concrete SQLite store; Continuum Core owns the stable row shape and transformation from Canonical Events.

## First failing test

`maps a Canonical Event into a Local Source Cache row`

## Acceptance Criteria

- [x] Export `LocalSourceCacheEventRow`.
- [x] Export `canonicalEventToLocalSourceCacheEventRow(event, ingestedAt)`.
- [x] Row includes flat columns from the agreed cache schema:
  - `id`
  - `sourcePlatform`
  - `sourceName`
  - `sourceKey`
  - `externalConversationId`
  - `externalMessageId`
  - `createdAt`
  - `createdAtConfidence`
  - `ingestedAt`
  - `actorRole`
  - `subject`
  - `text`
  - `eventJson`
- [x] `eventJson` preserves the full Canonical Event.
- [x] No SQLite dependency is added to Continuum Core.
- [x] Tests prove required fields are explicit and deterministic.

## Blocked by

- None.

## Notes

This is the core side of the Local Source Cache split. The Continuum Host App should use this contract to build its SQLite-backed local serving store.
