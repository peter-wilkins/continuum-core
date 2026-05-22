# 069: Evaluate Public Scope Events

Status: done

## Type

AFK.

## Context

Identity-first imports need a deterministic first pass that explains whether a canonical event appears to belong inside a public Import Scope.

This must not silently discard uncertain records. Uncertain primary-identity matches should remain inspectable as `needs_review`.

## What Was Built

Add `evaluatePublicScopeEvent(scope, event)`.

## First Failing Test

`includes public source events that match the primary identity and focus identity`

## Acceptance Criteria

- [x] Include events that match the primary identity and focus identity.
- [x] Keep primary-identity matches in `needs_review` when focus identity is uncertain.
- [x] Exclude events that do not match the primary identity.
- [x] Exclude events from source families outside the scope allowlist.
- [x] Return an action, reason, confidence, and matched terms.
- [x] Match against canonical event source ids, subject/text, and participants.

## Out Of Scope

- LLM classification.
- Embeddings.
- Full entity resolution.
- Mutating import previews.
- Hiding excluded records from inspection.

## Notes

This is deterministic and conservative by design. It creates explainable evidence for later curation rather than final truth.
