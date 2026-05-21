# 045: Import One GitHub Pull Request

Status: ready

## Type

AFK.

## What to build

Add core support for validating and normalizing one GitHub pull request object from the REST pulls API.

Use `data/github/octocat-hello-world-pulls.json` as source evidence and copy one minimal representative pull request into `src/fixtures/`.

## First failing test

`imports one GitHub pull request into the canonical event model`

## Acceptance Criteria

- [ ] Add a committed fixture for one GitHub pull request.
- [ ] Add a Zod parser for the pull-request source shape.
- [ ] Normalize title/body/created time/repository/number/head/base/merge sha into one canonical event.
- [ ] Use `source.platform: "github"`.
- [ ] Use repository plus PR number as the source grouping/artifact identity.
- [ ] Include head/base branch and sha details in normalized text.
- [ ] Preserve merge commit sha as content/provenance detail without treating it as independent Git commit evidence.
- [ ] Add provenance warning in docs if needed: PR metadata can refer to Git commits already imported from Git.

## Blocked by

- [042: Import One GitHub Issue Comment](042-import-one-github-issue-comment.md)

## Notes

Do not parse review comments or commit lists in this slice.
