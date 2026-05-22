# 068: Dry-Run With Import Scope

Status: done

## Type

AFK.

## Context

Public MVP imports are identity-first. `ImportScope` existed in the core model, and import batches could serialize it, but the CLI dry-run path still always produced `importScope: null`.

## What Was Built

Add optional `--scope <scope.json>` support to `continuum-import dry-run`.

## First Failing Test

`dry-runs a public document with an explicit Import Scope`

## Acceptance Criteria

- [x] Add an Ada Lovelace through computing Import Scope fixture.
- [x] `dry-run <source> <file> --scope <scope.json> --out <preview.json>` parses the scope.
- [x] The generated import batch stores the scope.
- [x] The preview JSON stores the scope.
- [x] Existing dry-run calls without `--scope` continue to store `importScope: null`.

## Out Of Scope

- Scope filtering.
- Scope-aware source fetching.
- Scope support on direct import commands.
- Persisting import batches.

## Notes

This is the smallest useful identity-first import step: public preview batches can now declare what they are about before later filtering/curation exists.
