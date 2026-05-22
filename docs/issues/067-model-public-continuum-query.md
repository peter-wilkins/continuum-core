# 067: Model Public Continuum Query

Status: done

## Type

AFK.

## Context

Lens outputs and Lens feedback already refer to a query id, but the public MVP did not yet model the query itself.

The first public page needs a visible seed query for the scope, for example:

```text
What did Ada Lovelace contribute to early computing?
```

## What Was Built

Add a required-field `PublicContinuumQuery` tied to an `ImportScope`.

## First Failing Test

`defines the initial public query for Ada Lovelace through computing`

## Acceptance Criteria

- [x] Query requires an id.
- [x] Query requires a scope id.
- [x] Query requires text.
- [x] Query records whether it came from a system seed or the user.
- [x] Query records creation time.
- [x] Constructor rejects queries whose `scopeId` does not match the provided `ImportScope`.
- [x] Constructor rejects blank query text.

## Out Of Scope

- Query generation.
- Query ranking.
- Query history UI.
- User preferences.
- Persisting queries.

## Notes

This keeps the app's first visible question explicit without treating it as source truth.
