# 071: Create Default Public Lens Outputs

Status: done

## Type

AFK.

## Context

The MVP has default Lens definitions and reference-only Lens output records, but the app still needs a simple deterministic way to create Atlas, Loom, and Beacon outputs from a scope, query, and source events.

## What Was Built

Add `createDefaultPublicLensOutputs(scope, query, events, generatedAt)`.

## First Failing Test

`creates default public Lens outputs from scope query and canonical events`

## Acceptance Criteria

- [x] Create Atlas, Loom, and Beacon outputs.
- [x] Each output references the same scope id and query id.
- [x] Each output stores ordered canonical event ids.
- [x] Sections store event ids only.
- [x] Generated output does not copy source event payload text.
- [x] Reject a query whose scope id does not match the scope.

## Out Of Scope

- LLM synthesis.
- UI layout.
- Persisting outputs.
- Choosing a winning Lens.

## Notes

Current deterministic strategies:

- Atlas: identity records then source trail.
- Loom: source-family groups.
- Beacon: strongest scope-evaluation signals first.
