# 087: Generate Lines Of Inquiry From Thought Cards

Status: planning

## Type

TDD.

## Context

The public MVP currently renders Wikipedia-derived Thought Cards. That proves source-backed display, but not Continuum's differentiator.

The product should move from facts to synthesis: cluster related Thought Cards, generate the next useful question, and help the human work toward agreement, a decision, or a sharper open thread.

## Product Decision

Next MVP slice should generate Lines of Inquiry from clustered Thought Cards rather than only cleaning paragraph extraction.

The first clustering shape should use Synthesis Moves rather than topic buckets. Topic buckets make better folders; Synthesis Moves make the product feel like thinking.

Synthesis Move names should be mostly hidden in the normal UI. The user should see the question first; a lightweight `why this?` reveal can expose the move and source evidence when useful.

The MVP baseline should start with three Synthesis Moves:

- Core Claim
- Tension
- Next Question

Question Card UX should align with Workflow Manager's Brain Dump Ingestion format: show the question, recommended answer, and Thought Journey Progress by default. Hide rationale, rejected options, and the branch map unless requested. The old suggested-next-step footer is retired for grilling surfaces.

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

- What makes a Line of Inquiry "good enough" to ask the human?
- What should `why this?` reveal include?
