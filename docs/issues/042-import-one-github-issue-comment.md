# 042: Import One GitHub Issue Comment

Status: done

## Type

AFK.

## What to build

Add core support for validating and normalizing one GitHub issue comment from the REST issue-comments API into the canonical event model.

Use the existing source catalogue sample at `data/github/octocat-hello-world-issue-comments.json`. Copy one minimal representative comment into `src/fixtures/` so tests do not depend on gitignored sample data.

## First failing test

`imports one GitHub issue comment into the canonical event model`

## Acceptance Criteria

- [x] Add a small committed fixture for one GitHub issue comment.
- [x] Add a Zod parser for the GitHub issue-comment source shape.
- [x] Normalize one comment into `CanonicalEvent`.
- [x] Add `github` as a canonical source platform.
- [x] Preserve issue URL/number as the source grouping id.
- [x] Preserve comment id/node id as the source record id.
- [x] Preserve author login as a participant or actor-adjacent source identity without inventing a person model.
- [x] Add provenance with `sourceFamily: "software_development"` and `sourceName: "github"`.
- [x] Update schema docs and source catalogue status if this is the first GitHub implementation.

## What Was Built

- Added `src/fixtures/github-one-issue-comment.json`.
- Added `parseGitHubIssueComment` and `normalizeGitHubIssueComment`.
- Normalized GitHub issue comments into canonical events with:
  - `source.platform: "github"`
  - grouping id like `owner/repo#number`
  - source record id as `comment.id:comment.node_id`
  - author login as an `author` participant
  - `software_development` / `github` provenance.
- Updated the canonical event schema docs and source catalogue.

## Blocked by

None - can start immediately.

## Notes

GitHub commits can duplicate Git commit evidence. Issue comments are collaboration records and should remain separate from raw Git commits.
