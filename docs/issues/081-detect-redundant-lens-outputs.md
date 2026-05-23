# 081: Detect Redundant Lens Outputs

Status: done

## Type

AFK.

## Context

Feedback from the public MVP experiment: two Lens outputs can appear to always produce the same thing. If two models or Lenses produce the same display, asking the user to compare them is wasted attention.

This is especially likely while Thought Cards are generated from `sourceEventIds` order. Different Lens names do not create useful diversity if they produce the same ordered cards.

## What Was Built

Added a deterministic Lens redundancy report that flags later Lens outputs as redundant when they share the same source-event display order as an earlier output.

## First failing test

`flags redundant Lens outputs when they would show the same Thought Card order`

## Acceptance Criteria

- [x] Compare Lens outputs by the ordered source event ids that drive current Thought Card display.
- [x] Keep the first output with a given display order.
- [x] Mark later outputs with the same display order as redundant.
- [x] Return retained ids, redundant ids, and a human-inspectable reason.
- [x] Do not mutate Lens outputs.

## Out Of Scope

- UI hiding.
- Regenerating replacement Lens outputs.
- Semantic similarity over generated text.
- LLM diversity scoring.
