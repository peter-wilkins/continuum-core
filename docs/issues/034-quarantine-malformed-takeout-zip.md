# 034: Quarantine Malformed Takeout Zip

## Type

AFK.

## What to build

Malformed zip input should not crash dry-run.

## Acceptance Criteria

- [x] Bad zip input does not throw during dry-run.
- [x] Bad zip input writes a preview.
- [x] Preview contains one recoverable `source_parse_failed` quarantine record.
- [x] Batch records one quarantined record.

## Notes

This gives the user a useful preview even when an export is corrupt or not actually a zip.
