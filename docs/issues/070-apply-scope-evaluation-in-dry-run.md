# 070: Apply Scope Evaluation In Dry-Run

Status: done

## Type

AFK.

## Context

`--scope` was attached to dry-run import batches, but preview filtering still used the generic personal `intentional_context` profile. Public scope dry-runs should use the explicit Import Scope for first-pass inclusion decisions.

## What Was Built

When a dry-run command has `--scope`, preview event filter decisions now come from `evaluatePublicScopeEvent`.

## First Failing Test

`dry-runs a public document with an explicit Import Scope`

## Acceptance Criteria

- [x] Scoped dry-runs use public scope evaluation.
- [x] Matching public documents are marked `include`.
- [x] Included scoped events are `memoryActive: true` in the preview.
- [x] Filter summaries count public scope reasons such as `primary_and_focus_match`.
- [x] Existing unscoped dry-runs keep using the import profile path.

## Out Of Scope

- Persisting scoped previews.
- LLM classification.
- Interactive curation.
- Direct import approval.

## Notes

This is the first place where identity-first import affects the actual import UX.
