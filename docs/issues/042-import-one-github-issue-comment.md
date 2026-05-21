# 042: Import One GitHub Issue Comment

Status: ready

## Type

AFK.

## What to build

Add core support for validating and normalizing one GitHub issue comment from the REST issue-comments API into the canonical event model.

Use the existing source catalogue sample at `data/github/octocat-hello-world-issue-comments.json`. Copy one minimal representative comment into `src/fixtures/` so tests do not depend on gitignored sample data.

## First failing test

`imports one GitHub issue comment into the canonical event model`

## Acceptance Criteria

- [ ] Add a small committed fixture for one GitHub issue comment.
- [ ] Add a Zod parser for the GitHub issue-comment source shape.
- [ ] Normalize one comment into `CanonicalEvent`.
- [ ] Add `github` as a canonical source platform.
- [ ] Preserve issue URL/number as the source grouping id.
- [ ] Preserve comment id/node id as the source record id.
- [ ] Preserve author login as a participant or actor-adjacent source identity without inventing a person model.
- [ ] Add provenance with `sourceFamily: "software_development"` and `sourceName: "github"`.
- [ ] Update schema docs and source catalogue status if this is the first GitHub implementation.

## Blocked by

None - can start immediately.

## Notes

GitHub commits can duplicate Git commit evidence. Issue comments are collaboration records and should remain separate from raw Git commits.
