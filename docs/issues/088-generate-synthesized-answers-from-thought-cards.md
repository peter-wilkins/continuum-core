# 088: Generate Synthesized Answers From Thought Cards

Status: planning

## Type

TDD.

## Context

The public MVP is moving from card-first to answer-first.

Thought Cards remain the source-backed units of support, but the first user-visible result should be a concise synthesized answer to a seed or spoken query. Cards, Lens variants, and source paragraphs become a `Why this?` / `Sources` drill-down.

The app MVP will also keep a visible Lens Compare surface because the first testers are comparing Lenses. This core issue should not hide or delete Lens outputs; it should add synthesized answers alongside existing compare material.

This keeps the UI closer to thinking:

```text
query
-> synthesized answer
-> Why this? / Sources drill-down
-> Line of Inquiry
```

## Product Decision

A synthesized answer is not source truth. It is a rebuildable Lens/projection over immutable source material.

The answer must carry references to the Thought Cards or source paragraphs that support it. If there is not enough evidence, the answer should say so instead of pretending.

The answer synthesis baseline should run over canonical Thought Cards before Lens ordering. Lens outputs can remain comparison/evidence/debug views, but answer generation should not depend on selecting one Lens first.

User-facing explanation language should be `Why this?` and `Sources`. Platform/domain language can use `Source Support` and `Source Trail`. Avoid `provenance`, `citation`, and `rationale` in normal UI copy.

MVP feedback in the app scores the whole visible result: query, synthesized answer, and Line of Inquiry. More granular Lens or answer scoring can come later.

The MVP answer can be deterministic and plain. An LLM can improve wording later, but the baseline should be testable without network calls.

## First Failing Test

It synthesizes a short answer from canonical Thought Cards and preserves the supporting Thought Card ids.

## Acceptance Criteria

- [ ] Produce a short answer for a bounded public query from Thought Cards.
- [ ] Run the first synthesis pass over canonical Thought Cards before Lens ordering.
- [ ] Preserve supporting Thought Card ids or source paragraph refs behind each answer.
- [ ] Do not store the answer as source truth.
- [ ] Return an explicit insufficient-evidence result when cards do not support an answer.
- [ ] Keep the output rebuildable from source material.
- [ ] Preserve enough ids for the app to keep Lens Compare visible alongside synthesized answers.
- [ ] Leave room for LLM wording later without making tests depend on an LLM.
- [ ] Pair cleanly with generated Lines of Inquiry from issue 087.

## Open Questions

None.

## Related

- `087-generate-lines-of-inquiry-from-thought-cards.md`
- `/home/peter/continuum/docs/issues/040-synthesized-answer-first-public-mvp.md`
