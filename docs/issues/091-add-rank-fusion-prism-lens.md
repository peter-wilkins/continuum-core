# 091: Add Rank-Fusion Prism Lens

Status: done

## Type

AFK.

## Context

The public MVP needs more useful backend model variation. Current Lens outputs are deterministic and inspectable, but the product should move toward modern retrieval practice without making the core library depend on embeddings, hosted models, or hidden state.

## What Was Built

Added a fourth default public Lens: `Prism`.

Prism blends existing deterministic rankings:

- source-trail order
- source-family interleaving
- scope signal strength
- query term overlap

It uses reciprocal-rank fusion over those rankings and a small source-family diversity penalty. If every active record comes from one source family, it uses newest-first ordering as a diversity fallback so it does not duplicate Loom or Beacon.

## First Failing Test

`default bootstrap Lens outputs have distinct display orders`

## Acceptance Criteria

- [x] Add a new default Lens with user and technical blurbs.
- [x] Keep Lens outputs reference-only.
- [x] Keep the implementation deterministic and testable without network calls.
- [x] Record generation parameters explaining the ordering strategy.
- [x] Preserve duplicate-Lens detection.
- [x] Document the research trail behind the model choice.

## Out Of Scope

- Embeddings.
- LLM reranking.
- Graph extraction.
- UI carousel changes.

## Related

- `081-detect-redundant-lens-outputs.md`
- `082-diversify-bootstrap-lens-strategies.md`
- `docs/backend-model-research.md`

