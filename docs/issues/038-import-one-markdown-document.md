# 038: Import One Markdown Document

## Type

AFK.

## What to build

Add core support for normalizing one Markdown/local document snapshot.

## Acceptance Criteria

- [x] Add Markdown fixture.
- [x] Normalize one Markdown document into the canonical event model.
- [x] Use the file path as source key, grouping id, message id, and artifact id.
- [x] Use modified time as event time.
- [x] Extract first H1 as subject.
- [x] Add `markdown` as a canonical source platform.
- [x] Mark Markdown/local docs as implemented in the source catalogue.

## Notes

This is a snapshot event. Later work can model diffs/revisions if needed.
