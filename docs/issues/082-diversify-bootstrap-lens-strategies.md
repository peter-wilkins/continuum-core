# 082: Diversify Bootstrap Lens Strategies

Status: done

## Type

AFK.

## Context

Issue 081 can now detect duplicate Lens display order, but the better product behaviour is not just hiding duplicates. The MVP should explore the space: if two Lens outputs collapse to the same shape, generate or select a more different Lens strategy.

Bootstrap topic:

```text
extended thought through brain augmentation
```

## What To Build

Make the default public Lens outputs more diverse for bootstrap public continuums.

## What Was Built

Default public Lens outputs now use Lens-specific deterministic source event ordering. Atlas keeps source-trail order, Loom interleaves source families, and Beacon orders by scope signal strength. The bootstrap diversity test uses the redundancy report from issue 081 to prove no duplicate display order is produced for mixed public events.

## First failing test

`default bootstrap Lens outputs have distinct display orders`

## Acceptance Criteria

- [x] Given mixed public events, Atlas, Loom, and Beacon should not all have the same `sourceEventIds` order.
- [x] Use the redundancy report from issue 081 to assert the diversity target.
- [x] Preserve reference-only Lens outputs; do not copy source payload text.
- [x] Keep deterministic fallback behaviour.
- [x] Record generation parameters that explain how each Lens differs.

## Suggested Strategy

- Atlas: source trail / provenance order.
- Loom: concept-family or source-family interleaving.
- Beacon: strongest query/scope match first.

## Out Of Scope

- LLM synthesis.
- UI carousel changes.
- User preference settings.
- Training a model.
