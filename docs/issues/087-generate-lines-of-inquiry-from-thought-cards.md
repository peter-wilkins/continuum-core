# 087: Generate Lines Of Inquiry From Thought Cards

Status: planning

## Type

TDD.

## Context

The public MVP currently renders Wikipedia-derived Thought Cards. That proves source-backed display, but not Continuum's differentiator.

The product should move from facts to synthesis: cluster related Thought Cards, generate the next useful question, and help the human work toward agreement, a decision, or a sharper open thread.

## Product Decision

Next MVP slice should generate Lines of Inquiry from clustered Thought Cards rather than only cleaning paragraph extraction.

## First Failing Test

TBD after grilling.

## Acceptance Criteria

- [ ] Build one deterministic baseline from Thought Cards to candidate Lines of Inquiry.
- [ ] Preserve source Thought Card ids behind each Line.
- [ ] Return more than one candidate Line when the evidence supports multiple possible directions.
- [ ] Mark the recommended next Line explicitly.
- [ ] Keep generated Lines rebuildable and non-source-truth.
- [ ] Leave room for LLM-generated Lines later without making the MVP depend on an LLM.

## Open Questions

- What kind of clustering should the first baseline use?
- What makes a Line of Inquiry "good enough" to ask the human?
- Does the app show one next question, several candidate questions, or a clustered map first?
