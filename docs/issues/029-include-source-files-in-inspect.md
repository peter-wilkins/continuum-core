# 029: Include Source Files In Inspect

## Type

AFK.

## What to build

Expose source-file routing summaries in `inspect`, not only in dry-run preview JSON.

## Acceptance Criteria

- [x] Inspect results include `sourceFiles`.
- [x] Single-file sources return an empty source-file summary.
- [x] Google Takeout folder inspect returns matched files.
- [x] Google Takeout folder inspect returns skipped files.
- [x] Source-file summaries include events and quarantine counts.

## Notes

This lets callers audit routing without writing a preview artifact.
