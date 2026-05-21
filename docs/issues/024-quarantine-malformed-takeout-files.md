# 024: Quarantine Malformed Takeout Files

## Type

AFK.

## What to build

Bad files inside a Google Takeout folder should not abort the whole folder import.

## Acceptance Criteria

- [x] Malformed JSON in a routed Takeout file becomes a quarantine record.
- [x] The file preview marks that file as `invalid`.
- [x] The folder dry-run continues instead of throwing.
- [x] The quarantine record is recoverable.

## Notes

This protects the broad-folder workflow from one corrupt or partially downloaded file.
