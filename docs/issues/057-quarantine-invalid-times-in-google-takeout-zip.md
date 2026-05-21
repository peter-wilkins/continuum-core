# 057: Quarantine Invalid Times In Google Takeout Zip

Status: done

## Type

AFK.

## What to build

Real Google Takeout zip import exposed an `Invalid time value` crash. Make Google Takeout folder/zip import resilient when a routed source record has an invalid timestamp.

The importer should quarantine the bad record or file and continue inspecting/importing the rest of the archive.

## First failing test

`quarantines a Google Takeout zip record with an invalid time`

## Acceptance Criteria

- [x] Add a focused fixture or generated test record with an invalid timestamp in a routed Google source.
- [x] Dry-run of a Google Takeout zip does not throw `Invalid time value`.
- [x] Bad timestamp input produces a recoverable quarantine record.
- [x] Source-file preview marks the affected file as `invalid` or reports quarantine records.
- [x] Valid records in the same zip still import or preview normally.
- [x] The fix applies to the source adapter boundary, not only one CLI command path.

## Blocked by

None - can start immediately.

## Notes

Observed from real local Takeout import attempt:

- whole-zip inspect returned 0 importable rows for broad Takeout zips
- most files were unsupported product families
- one zip hit `Invalid time value`
- direct Chrome Bookmarks source import worked and loaded 5 rows into the Continuum Local Source Cache

Likely areas to inspect:

- Chrome bookmark `ADD_DATE`
- Chrome reading list `ADD_DATE`
- Chrome history `time_usec`
- Google My Activity `time`
- Markdown/zip modified time handling

Do not add broad support for every unsupported Google product in this issue.
