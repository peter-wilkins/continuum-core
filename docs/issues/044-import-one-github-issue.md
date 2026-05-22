# 044: Import One GitHub Issue

Status: done

## Type

AFK.

## What to build

Add core support for validating and normalizing one GitHub issue or PR-as-issue object from the REST issues API.

Use `data/github/octocat-hello-world-issues.json` as source evidence and copy one minimal representative issue into `src/fixtures/`.

## First failing test

`imports one GitHub issue into the canonical event model`

## Acceptance Criteria

- [x] Add a committed fixture for one GitHub issue.
- [x] Add a Zod parser for the GitHub issue source shape.
- [x] Normalize title/body/created time/repository/number/state into one canonical event.
- [x] Use `source.platform: "github"`.
- [x] Use the repository plus issue number as the source grouping/artifact identity.
- [x] Preserve GitHub user login without inventing identity resolution.
- [x] Distinguish normal issues from PR-backed issues when the `pull_request` field is present.
- [x] Update docs/specs if the canonical model needs a new source or participant role.

## What Was Built

- Added `src/fixtures/github-one-issue.json`.
- Added `parseGitHubIssue` and `normalizeGitHubIssue`.
- Normalized GitHub issue-shaped records into canonical events with:
  - grouping id like `owner/repo#number`
  - source record id as `issue.id:issue.node_id`
  - title/body/state/repository/number/comments in event text
  - author login as an `author` participant
  - `Kind: pull_request` when `pull_request` is present.
- No canonical model changes were needed beyond the existing `github` source platform and `author` participant role.

## Blocked by

- [042: Import One GitHub Issue Comment](042-import-one-github-issue-comment.md)

## Notes

Keep issue-created events separate from later issue-comment events. State changes and timeline events are later slices.
