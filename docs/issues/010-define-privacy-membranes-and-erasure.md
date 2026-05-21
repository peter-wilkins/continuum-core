# 010: Define Privacy Membranes And Erasure

## Type

AFK.

## What to build

Protect private payloads inside the inner core while making disclosure/export respect erasure.

The inner core can ingest broadly and retain immutable event history. The membrane decides what can cross into prompts, exports, sync, or sharing.

## First failing test

An erased protected payload cannot be read, but its immutable tombstone remains and disclosure blocks the event.

## Acceptance Criteria

- [x] Protected payloads have classification metadata.
- [x] Payload read succeeds before erasure.
- [x] Erasure removes key material and leaves tombstone metadata.
- [x] Disclosure membrane blocks erased payloads.
- [x] Decision log records why disclosure was blocked.

## Notes

- Immutable does not mean readable forever.
- Delete means payload is no longer recoverable and derived/disclosure views must exclude it.
- This slice uses local cryptographic erasure semantics with AES-256-GCM envelope encryption.
- Later storage adapters should store key material separately enough that key deletion is operationally meaningful.
