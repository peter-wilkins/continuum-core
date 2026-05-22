# 065: Model Reference-Only Lens Outputs

Status: done

## Type

AFK.

## Context

The public MVP compares multiple generated surfaces for the same query and scope. Users can swipe between Lens candidates such as Atlas, Loom, and Beacon, then vote for the one that feels most useful.

Lenses must not become hidden source truth. They should store source ids, ordering, sections, and generation parameters before any copied/generated content.

## What Was Built

Add MVP Lens definitions and a reference-only Lens output model.

## First Failing Test

`stores a Lens output as ordered canonical event ids without copied event payloads`

## Acceptance Criteria

- [x] Define default public Lens definitions: Atlas, Loom, Beacon.
- [x] Each Lens has a user blurb and technical blurb.
- [x] Define a `LensOutput` projection with scope id, query id, lens id/version, generated time, ordered source event ids, sections, and generation metadata.
- [x] Store section membership as event ids only.
- [x] Do not store copied event payload text in the Lens output model.
- [x] Reject Lens outputs whose sections reference events outside the source event set.

## Out Of Scope

- UI rendering.
- LLM generation.
- Persisting Lens outputs.
- Feedback/voting storage.
- Deciding which Lens wins.

## Notes

This follows the current source-truth rule:

> Source of truth first. Lenses over copies. Duplicate state only by exception.
