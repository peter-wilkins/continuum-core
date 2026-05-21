# 023: Add Source File Preview Summary

## Type

AFK.

## What to build

Make dry-run previews explain which source files were matched, skipped, or invalid.

## Acceptance Criteria

- [x] Add `sourceFiles` to dry-run preview JSON.
- [x] Include source file path.
- [x] Include matched adapter name or `null`.
- [x] Include status: `matched`, `skipped`, or `invalid`.
- [x] Include events created per file.
- [x] Include quarantine records per file.
- [x] Folder previews show one row per routed Takeout file.

## Notes

This makes folder imports auditable before approval without opening the full event list.
