# 039: Wire Markdown Into CLI

## Type

AFK.

## What to build

Make Markdown/local document snapshots usable through the CLI and Takeout folder/zip routing.

## Acceptance Criteria

- [x] CLI accepts `markdown`.
- [x] CLI imports one Markdown file into JSONL.
- [x] Takeout folder/zip routing detects `.md` and `.markdown` files.
- [x] Markdown file modification time confidence is explicit.
- [x] Zip/folder Markdown imports use unknown time confidence with an explicit placeholder timestamp.

## Notes

Markdown from zip/folder entries may not expose trustworthy modification times yet. The event marks that uncertainty instead of pretending the timestamp is exact.
