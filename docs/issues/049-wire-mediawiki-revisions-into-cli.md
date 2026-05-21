# 049: Wire MediaWiki Revisions Into CLI

Status: done

## Type

AFK.

## What to build

Make existing MediaWiki revision normalization usable through `continuum-import`.

## First failing test

`imports MediaWiki revisions through the CLI`

## Acceptance Criteria

- [x] CLI accepts `mediawiki-revisions`.
- [x] CLI imports the existing MediaWiki fixture into JSONL.
- [x] CLI dry-run writes a preview with one revision event.
- [x] Malformed MediaWiki JSON quarantines instead of throwing.
- [x] Folder/zip routing detects MediaWiki revision JSON by filename and by schema where practical.
- [x] CLI usage docs mention `mediawiki-revisions`.

## Blocked by

None - can start immediately.

## Notes

Core normalization already exists. This should mostly copy the CLI pattern from Git log, Markdown, and iCalendar.
