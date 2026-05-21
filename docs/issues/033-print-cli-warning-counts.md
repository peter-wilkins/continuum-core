# 033: Print CLI Warning Counts

## Type

AFK.

## What to build

Human CLI output should show warnings and source-file counts, matching the structured result data.

## Acceptance Criteria

- [x] Extract testable CLI result formatter.
- [x] Inspect output prints warnings.
- [x] Inspect output prints source-file count.
- [x] Dry-run output prints warnings.
- [x] Dry-run output prints source-file count.
- [x] Import output prints warnings.

## Notes

This makes skipped Takeout files visible in terminal output without opening preview JSON.
