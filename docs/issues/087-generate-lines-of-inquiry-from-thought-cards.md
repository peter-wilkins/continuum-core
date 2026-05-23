# 087: Generate Lines Of Inquiry From Thought Cards

Status: ready

## Type

TDD.

## Context

The public MVP currently renders Wikipedia-derived Thought Cards. That proves source-backed display, but not Continuum's differentiator.

The product should move from facts to synthesis: cluster related Thought Cards, generate the next useful question, and help the human work toward agreement, a decision, or a sharper open thread.

The app direction is answer-first rather than card-first: the user sees a synthesized answer, can use `Why this?` / `Sources`, can compare Lenses, then receives one Line of Inquiry. This issue owns the Line of Inquiry part of that flow.

## Product Decision

Next MVP slice should generate Lines of Inquiry from clustered Thought Cards rather than only cleaning paragraph extraction.

The first clustering shape should use Synthesis Moves rather than topic buckets. Topic buckets make better folders; Synthesis Moves make the product feel like thinking.

Synthesis Move names should be mostly hidden in the normal UI. The user should see the question first; a lightweight `Why this?` reveal can expose the move and source support when useful.

The MVP baseline should start with three Synthesis Moves:

- Core Claim
- Tension
- Next Question

Question Card UX should align with Workflow Manager's Brain Dump Ingestion format: show the question, recommended answer, and a coarse Thought Journey Progress bar by default. Hide rationale, rejected options, and the branch map unless requested. The old suggested-next-step footer is retired for grilling surfaces.

A Line of Inquiry is good enough to ask the human when it is source-grounded, answerable now, small enough for one response, and likely to move synthesis forward rather than only request more facts.

The `Why this?` reveal for a Line should show the Synthesis Move and Source Support that made the question useful. It should not expose the raw branch map by default.

## First Failing Test

It generates a recommended Line of Inquiry from canonical Thought Cards using a Synthesis Move and preserves the supporting Thought Card ids.

## Acceptance Criteria

- [ ] Build one deterministic baseline from Thought Cards to candidate Lines of Inquiry.
- [ ] Preserve source Thought Card ids behind each Line.
- [ ] Only recommend Lines that meet the good-enough threshold: source-grounded, answerable now, small enough for one response, and synthesis-moving.
- [ ] Return more than one candidate Line when the evidence supports multiple possible directions.
- [ ] Mark the recommended next Line explicitly.
- [ ] Keep generated Lines rebuildable and non-source-truth.
- [ ] Leave room for LLM-generated Lines later without making the MVP depend on an LLM.
- [ ] Pair cleanly with synthesized answers from issue 088.

## Open Questions

None.

## Blocked by

- `088-generate-synthesized-answers-from-thought-cards.md`
