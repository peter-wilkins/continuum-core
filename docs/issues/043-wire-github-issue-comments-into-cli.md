# 043: Wire GitHub Issue Comments Into CLI

Status: done

## Type

AFK.

## What to build

Make GitHub issue-comment JSON usable through `continuum-import`, including inspect, dry-run, import, and folder/zip routing.

## First failing test

`imports GitHub issue comments through the CLI`

## Acceptance Criteria

- [x] CLI accepts a `github-issue-comments` source command.
- [x] CLI imports the committed issue-comment fixture into JSONL.
- [x] CLI dry-run writes a preview with one event.
- [x] Malformed GitHub issue-comment JSON quarantines instead of throwing.
- [x] Folder/zip routing detects issue-comment JSON by filename and by schema where practical.
- [x] CLI usage docs mention `github-issue-comments`.

## What Was Built

- Added the `github-issue-comments` source command.
- Allowed GitHub issue-comment source input as either one comment object or an array of comments.
- Wired direct import, inspect/dry-run normalization, validation quarantine, folder routing, and zip routing.
- Updated README and import spec CLI docs.

## Blocked by

- [042: Import One GitHub Issue Comment](042-import-one-github-issue-comment.md)

## Notes

Copy the iCalendar, Markdown, and Git log CLI slices. Keep this thin; do not implement issues, PRs, reviews, or timeline events here.
