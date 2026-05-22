# 046: Wire GitHub Collaboration Sources Into CLI

Status: done

## Type

AFK.

## What to build

Wire the GitHub issue and pull-request parsers into `continuum-import`, following the source-specific CLI patterns already used by Git log, Markdown, and iCalendar.

## First failing test

`imports GitHub issues and pull requests through the CLI`

## Acceptance Criteria

- [x] CLI accepts `github-issues`.
- [x] CLI accepts `github-pulls`.
- [x] CLI imports committed issue and pull fixtures into JSONL.
- [x] CLI dry-run previews both source types.
- [x] Malformed GitHub issue/pull JSON quarantines instead of throwing.
- [x] Folder/zip routing detects these files by filename and by schema where practical.
- [x] CLI usage docs mention `github-issues` and `github-pulls`.

## What Was Built

- Added `github-issues` and `github-pulls` source commands.
- Allowed both commands to accept either one object or an array of objects.
- Wired direct import, dry-run, validation quarantine, folder filename routing, and zip schema routing.
- Updated README and import spec CLI docs.

## Blocked by

- [044: Import One GitHub Issue](044-import-one-github-issue.md)
- [045: Import One GitHub Pull Request](045-import-one-github-pull-request.md)

## Notes

Keep issue comments in `github-issue-comments`; this issue wires issues and pulls only.
