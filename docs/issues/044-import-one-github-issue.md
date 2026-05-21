# 044: Import One GitHub Issue

Status: ready

## Type

AFK.

## What to build

Add core support for validating and normalizing one GitHub issue or PR-as-issue object from the REST issues API.

Use `data/github/octocat-hello-world-issues.json` as source evidence and copy one minimal representative issue into `src/fixtures/`.

## First failing test

`imports one GitHub issue into the canonical event model`

## Acceptance Criteria

- [ ] Add a committed fixture for one GitHub issue.
- [ ] Add a Zod parser for the GitHub issue source shape.
- [ ] Normalize title/body/created time/repository/number/state into one canonical event.
- [ ] Use `source.platform: "github"`.
- [ ] Use the repository plus issue number as the source grouping/artifact identity.
- [ ] Preserve GitHub user login without inventing identity resolution.
- [ ] Distinguish normal issues from PR-backed issues when the `pull_request` field is present.
- [ ] Update docs/specs if the canonical model needs a new source or participant role.

## Blocked by

- [042: Import One GitHub Issue Comment](042-import-one-github-issue-comment.md)

## Notes

Keep issue-created events separate from later issue-comment events. State changes and timeline events are later slices.
