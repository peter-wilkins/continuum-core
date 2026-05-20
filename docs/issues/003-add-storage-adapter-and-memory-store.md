# 003: Add Storage Adapter and Memory Store

## Goal

Define storage boundaries so Host Apps can own persistence while the core remains runnable in tests and prototypes.

## Acceptance Criteria

- Exports a `StorageAdapter` interface covering Entries, Continuations, Continuation Links, Resume Brief material needed for MVP, and forget/tombstone data.
- Provides an in-memory implementation for tests and demos.
- Storage API supports creating, reading, linking, and forgetting Entries without exposing infrastructure-specific details.
- In-memory store is deterministic and resets cleanly between tests.
- No SQLite, Postgres, Supabase, IndexedDB, or filesystem persistence is added.

## Notes

- Follow ADR 0002: storage adapter first.
- Keep storage operations shaped around domain terms, not table names.
