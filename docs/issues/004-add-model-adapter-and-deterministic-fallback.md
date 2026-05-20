# 004: Add Model Adapter and Deterministic Fallback

## Goal

Define model boundaries for embeddings, summarisation, and classification without requiring network access or provider credentials.

## Acceptance Criteria

- Exports a `ModelAdapter` interface for MVP inference needs.
- Provides deterministic fallback behavior for tests and local demos.
- Fallback can rank/retrieve with simple token overlap or equivalent deterministic logic.
- Fallback can produce simple Resume Brief summaries without calling external APIs.
- Tests prove outputs are stable across runs.
- No OpenAI, Anthropic, local model runtime, or network dependency is required by core.

## Notes

- Follow ADR 0003: model adapter with deterministic fallback.
- Host Apps can provide stronger model adapters later.
