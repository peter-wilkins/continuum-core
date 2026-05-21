# 046: Wire GitHub Collaboration Sources Into CLI

Status: ready

## Type

AFK.

## What to build

Wire the GitHub issue and pull-request parsers into `continuum-import`, following the source-specific CLI patterns already used by Git log, Markdown, and iCalendar.

## First failing test

`imports GitHub issues and pull requests through the CLI`

## Acceptance Criteria

- [ ] CLI accepts `github-issues`.
- [ ] CLI accepts `github-pulls`.
- [ ] CLI imports committed issue and pull fixtures into JSONL.
- [ ] CLI dry-run previews both source types.
- [ ] Malformed GitHub issue/pull JSON quarantines instead of throwing.
- [ ] Folder/zip routing detects these files by filename and by schema where practical.
- [ ] CLI usage docs mention `github-issues` and `github-pulls`.

## Blocked by

- [044: Import One GitHub Issue](044-import-one-github-issue.md)
- [045: Import One GitHub Pull Request](045-import-one-github-pull-request.md)

## Notes

Keep issue comments in `github-issue-comments`; this issue wires issues and pulls only.
