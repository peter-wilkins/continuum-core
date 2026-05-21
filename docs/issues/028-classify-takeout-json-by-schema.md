# 028: Classify Takeout JSON By Schema

## Type

AFK.

## What to build

The Google Takeout folder classifier should recognize known JSON files even when filenames are generic.

## Acceptance Criteria

- [x] Generic JSON containing `Browser History` routes to Chrome history.
- [x] Generic JSON containing My Activity records routes to Google My Activity.
- [x] Unknown generic JSON remains skipped as a warning.
- [x] Malformed routed JSON still quarantines through filename routing.

## Notes

This makes the folder importer less dependent on exact Google export filenames.
