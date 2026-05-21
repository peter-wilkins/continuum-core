# 040: Import One Git Commit

Status: done

## Goal

Add core support for parsing and normalizing one Git commit from `git log --stat` output.

## Acceptance Criteria

- [x] Add a committed Git log fixture.
- [x] Parse commit hash, author, date, subject, changed files, and stat summary.
- [x] Normalize one Git commit into the canonical event model.
- [x] Add `git` as a canonical source platform.
- [x] Add `author` as a canonical participant role.
- [x] Mark Git commits as implemented in the source catalogue.

## Notes

Git commits are software development evidence. GitHub may mirror these commits, so provenance must prevent double-counting Git and GitHub commit records as independent evidence.
