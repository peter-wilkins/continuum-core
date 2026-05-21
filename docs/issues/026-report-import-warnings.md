# 026: Report Import Warnings

## Type

AFK.

## What to build

Import results should report skipped-file warnings, not only inspect and dry-run results.

## Acceptance Criteria

- [x] Import CLI result includes `warnings`.
- [x] Existing single-file imports report zero warnings.
- [x] Google Takeout folder imports report skipped unsupported files.
- [x] Folder import ignores its own output JSONL file on reimport.

## Notes

This keeps idempotent folder imports stable when the output file is written inside the folder being imported.
