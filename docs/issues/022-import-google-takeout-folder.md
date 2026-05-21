# 022: Import Google Takeout Folder

## Type

AFK.

## What to build

Let `continuum-import google-takeout-folder <folder> --out <events.jsonl>` import all known files in a local Takeout-style folder.

## Acceptance Criteria

- [x] Reuse the folder classifier from inspect/dry-run.
- [x] Import known Chrome history, Chrome bookmarks, and My Activity events into one JSONL.
- [x] Preserve existing merge/idempotency behavior.
- [x] Reimport the same folder without duplicate events.

## Notes

ZIP archive support is still separate. For now, unzip Takeout locally and point the CLI at the folder.
