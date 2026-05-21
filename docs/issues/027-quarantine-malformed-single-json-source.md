# 027: Quarantine Malformed Single JSON Source

## Type

AFK.

## What to build

Malformed JSON passed as a single source file should become a recoverable quarantine record during inspect/dry-run/import instead of throwing before preview.

## Acceptance Criteria

- [x] Bad single JSON input does not throw during dry-run.
- [x] Bad single JSON input writes a preview.
- [x] Preview contains one recoverable `source_parse_failed` quarantine record.
- [x] Preview source file summary marks the file `invalid`.

## Notes

This matches folder behavior and keeps dry-run useful for diagnosing export problems.
