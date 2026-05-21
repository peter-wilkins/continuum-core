# 031: Import Google Takeout Zip

## Type

AFK.

## What to build

Lock `google-takeout-zip` support across inspect and import, not only dry-run.

## Acceptance Criteria

- [x] Inspect a Google Takeout zip.
- [x] Import a Google Takeout zip into JSONL.
- [x] Reimport the same zip without duplicate events.
- [x] Preserve warning and validation counts.

## Notes

Zip entries are treated like folder-relative files and use the same classifier.
