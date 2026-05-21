# 036: Wire iCalendar Into CLI

## Type

AFK.

## What to build

Make iCalendar usable through the import CLI and Google Takeout folder/zip routing.

## Acceptance Criteria

- [x] CLI accepts `icalendar`.
- [x] CLI imports one `.ics` file into JSONL.
- [x] Google Takeout zip routing detects `.ics` files.
- [x] Takeout zip dry-run reports iCalendar source-file summary.

## Notes

Calendar files are common in Google Takeout. This keeps the "import the pack" path broad without adding a new app-specific command shape.
