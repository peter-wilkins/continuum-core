# 020: Inspect Google Takeout Folder

## Type

AFK.

## What to build

Let `continuum-import inspect google-takeout-folder <folder>` walk a local Takeout-style directory and route known files to existing Google adapters.

## Acceptance Criteria

- [x] Recursively walk a local folder.
- [x] Detect Chrome browser history JSON.
- [x] Detect Chrome bookmarks HTML.
- [x] Detect Chrome reading list HTML.
- [x] Detect Google My Activity JSON.
- [x] Count importable events across known files.
- [x] Quarantine unsupported files as recoverable records.
- [x] Do not treat folder file count as conversation count.

## Notes

This slice is inspect-only for folders. Folder dry-run/import should reuse the same classifier next.
