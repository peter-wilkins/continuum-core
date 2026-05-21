# 041: Wire Git Log Into CLI

Status: done

## Goal

Make parsed Git commits usable through the import CLI.

## Acceptance Criteria

- [x] CLI accepts `git-log`.
- [x] CLI imports one Git log fixture into JSONL.
- [x] Folder/zip routing detects `.gitlog` and `.git-log.txt` files.
- [x] Invalid Git log records use existing quarantine plumbing.

## Notes

The CLI treats the input filename as the repository grouping id for now. Real repository discovery can come later when importing directly from a working tree.
