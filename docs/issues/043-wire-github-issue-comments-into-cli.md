# 043: Wire GitHub Issue Comments Into CLI

Status: ready

## Type

AFK.

## What to build

Make GitHub issue-comment JSON usable through `continuum-import`, including inspect, dry-run, import, and folder/zip routing.

## First failing test

`imports GitHub issue comments through the CLI`

## Acceptance Criteria

- [ ] CLI accepts a `github-issue-comments` source command.
- [ ] CLI imports the committed issue-comment fixture into JSONL.
- [ ] CLI dry-run writes a preview with one event.
- [ ] Malformed GitHub issue-comment JSON quarantines instead of throwing.
- [ ] Folder/zip routing detects issue-comment JSON by filename and by schema where practical.
- [ ] CLI usage docs mention `github-issue-comments`.

## Blocked by

- [042: Import One GitHub Issue Comment](042-import-one-github-issue-comment.md)

## Notes

Copy the iCalendar, Markdown, and Git log CLI slices. Keep this thin; do not implement issues, PRs, reviews, or timeline events here.
