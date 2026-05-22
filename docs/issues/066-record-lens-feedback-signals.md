# 066: Record Lens Feedback Signals

Status: done

## Type

AFK.

## Context

The public MVP shows several Lens candidates for the same scope and query. A signed-in user can pick the one that felt most useful.

This is feedback evidence about a candidate set, not a settings system or personal preference model.

## What Was Built

Add a required-field `LensFeedbackSignal` model and constructor validation.

## First Failing Test

`records a signed-in user's preferred Lens for one query and scope`

## Acceptance Criteria

- [x] Feedback requires a signal id.
- [x] Feedback requires a signed-in user id.
- [x] Feedback requires scope id and query id.
- [x] Feedback records the selected Lens output id.
- [x] Feedback records the full candidate Lens output id set the user chose from.
- [x] Feedback rejects a selected output that was not in the candidate set.
- [x] Feedback records creation time.

## Out Of Scope

- OAuth flow.
- Pending feedback replay after sign-in.
- Persisting feedback to Supabase/Postgres.
- User preference settings.
- Negative feedback.

## Notes

The MVP signal is intentionally small:

```text
For this scope and query, from these Lens outputs, this signed-in user preferred this one.
```
