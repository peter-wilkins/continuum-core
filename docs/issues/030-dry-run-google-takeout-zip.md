# 030: Dry Run Google Takeout Zip

## Type

AFK.

## What to build

Let `continuum-import dry-run google-takeout-zip <takeout.zip> --out <preview.json>` inspect zip contents with the same classifier as folder imports.

## Acceptance Criteria

- [x] Add pure JavaScript zip reading.
- [x] Route Chrome history JSON from a zip.
- [x] Route Chrome bookmarks HTML from a zip.
- [x] Mark unsupported zip entries as skipped warnings.
- [x] Report zip file count, records seen, events created, and warnings.

## Notes

This avoids forcing the user to manually unzip before dry-run. Import/inspect for zips reuse the same source path internally.
