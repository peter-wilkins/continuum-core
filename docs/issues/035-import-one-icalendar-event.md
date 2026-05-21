# 035: Import One iCalendar Event

## Type

AFK.

## What to build

Add a minimal iCalendar VEVENT parser and normalizer for Google Calendar / calendar exports.

## Acceptance Criteria

- [x] Parse one VEVENT from an `.ics` file.
- [x] Extract UID, timestamps, summary, description, location, and attendees.
- [x] Reject VEVENTs missing required fields.
- [x] Normalize one calendar event into the canonical event model.
- [x] Add `icalendar` as a canonical source platform.
- [x] Add `attendee` as a participant role.
- [x] Mark Calendar / iCalendar as implemented in the source catalogue.

## Notes

This is core-library support only. CLI routing for `.ics` files can be the next slice.
