# 019: Wire Google Sources Into CLI

## Type

AFK.

## What to build

Make the Google import sources usable through `continuum-import`, not only through library normalizers.

## Acceptance Criteria

- [x] CLI accepts `google-chrome-history`.
- [x] CLI accepts `google-chrome-bookmarks`.
- [x] CLI accepts `google-chrome-reading-list`.
- [x] CLI accepts `google-my-activity`.
- [x] Import writes Chrome history JSONL.
- [x] Dry-run previews Chrome bookmarks HTML.
- [x] Inspect reports Chrome reading list HTML counts.
- [x] Import writes mixed Google My Activity JSONL.
- [x] HTML sources are read as text, not JSON.
- [x] Validation failures become quarantine records instead of thrown parser errors.

## Notes

The CLI still imports one explicit source file at a time. Archive walking can come later.
