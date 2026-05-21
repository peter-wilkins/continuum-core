# 037: Preserve iCalendar Source Path

## Type

AFK.

## What to build

iCalendar events imported through the CLI should preserve their actual source file path.

## Acceptance Criteria

- [x] Single `.ics` import uses the input filename as `externalConversationId`.
- [x] Takeout folder/zip `.ics` imports use the relative source path internally.
- [x] Tests pin the single-file behavior.

## Notes

This improves provenance and keeps multiple calendar files distinguishable during import review.
