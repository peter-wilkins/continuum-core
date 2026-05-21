# 021: Dry Run Google Takeout Folder

## Type

AFK.

## What to build

Let `continuum-import dry-run google-takeout-folder <folder> --out <preview.json>` produce one combined preview across known Takeout files.

## Acceptance Criteria

- [x] Reuse the folder classifier from inspect.
- [x] Combine Chrome history, Chrome bookmarks, and My Activity events in one preview.
- [x] Report actual files seen in the import batch.
- [x] Report combined records seen.
- [x] Keep unsupported files recoverable through quarantine.

## Notes

This does not yet write folder events to JSONL. That can be the next slice.
