# 086: Diversify Single-Family Loom Order

Status: done

## Type

TDD.

## Context

The real bootstrap preview has all active records from one source family: Wikipedia. That makes Loom's source-family interleave produce the same display order as Atlas.

This matches yesterday's UI feedback: if two Lens outputs show the same cards, the user does not need both.

## What To Build

Keep Loom's source-family interleave when multiple families are present. When all events are from one source family, order Loom by Occurrence Time instead, preserving deterministic tie-breaking.

## First Failing Test

`keeps Loom distinct when all active sources share one source family`

## Acceptance Criteria

- [x] Existing multi-family Loom interleave behaviour remains unchanged.
- [x] Single-family Loom ordering differs from Atlas when event times allow it.
- [x] Single-family Loom remains deterministic.
- [x] Lens redundancy detection reports no redundant Lens for the real bootstrap-shaped case.
- [x] Ordering metadata names the fallback clearly.

## Out Of Scope

- New Lens definitions.
- LLM ranking.
- UI hiding of redundant Lens outputs.

## Verification

Real bootstrap preview now reports no redundant Lens outputs:

- Atlas: source trail order
- Loom: source-family interleave with Occurrence Time fallback
- Beacon: scope signal strength order
