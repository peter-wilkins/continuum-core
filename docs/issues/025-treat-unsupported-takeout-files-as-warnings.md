# 025: Treat Unsupported Takeout Files As Warnings

## Type

AFK.

## What to build

Unsupported files in a Takeout folder should be skipped as warnings, not counted as validation errors.

## Acceptance Criteria

- [x] Inspect results include warning count.
- [x] Dry-run batch stats include warning count.
- [x] Unsupported files are marked `skipped` in source file summaries.
- [x] Unsupported files do not create quarantine records.
- [x] Malformed routed files still create quarantine records.

## Notes

This separates "we do not import this source yet" from "this source file is broken."
