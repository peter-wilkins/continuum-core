# 045: Import One GitHub Pull Request

Status: done

## Type

AFK.

## What to build

Add core support for validating and normalizing one GitHub pull request object from the REST pulls API.

Use `data/github/octocat-hello-world-pulls.json` as source evidence and copy one minimal representative pull request into `src/fixtures/`.

## First failing test

`imports one GitHub pull request into the canonical event model`

## Acceptance Criteria

- [x] Add a committed fixture for one GitHub pull request.
- [x] Add a Zod parser for the pull-request source shape.
- [x] Normalize title/body/created time/repository/number/head/base/merge sha into one canonical event.
- [x] Use `source.platform: "github"`.
- [x] Use repository plus PR number as the source grouping/artifact identity.
- [x] Include head/base branch and sha details in normalized text.
- [x] Preserve merge commit sha as content/provenance detail without treating it as independent Git commit evidence.
- [x] Add provenance warning in docs if needed: PR metadata can refer to Git commits already imported from Git.

## What Was Built

- Added `src/fixtures/github-one-pull-request.json`.
- Added `parseGitHubPullRequest` and `normalizeGitHubPullRequest`.
- Normalized PR metadata into canonical events with:
  - grouping id like `owner/repo#number`
  - source record id as `pullRequest.id:pullRequest.node_id`
  - head/base label/ref/sha details in event text
  - merge commit sha preserved as referenced content
  - author login as an `author` participant.
- Updated source-catalogue provenance guidance so PR SHAs are not counted as independent Git commit evidence.

## Blocked by

- [042: Import One GitHub Issue Comment](042-import-one-github-issue-comment.md)

## Notes

Do not parse review comments or commit lists in this slice.
