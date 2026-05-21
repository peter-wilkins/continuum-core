# 002: Rank Import Sources and Schema Targets

## Type

HITL.

## Blocked by

- [001: Scaffold TypeScript Library](001-scaffold-typescript-library.md)

## What to build

Create a living source catalogue for the import tool. The catalogue should rank likely import sources by Continuum value, access practicality, schema diversity, privacy risk, and pressure on the canonical event model.

This is a research slice, but it should still be test-shaped: each source needs enough evidence to justify why it belongs before or after another source.

## First failing check

The repo contains a source catalogue that lets us pick the next schema target without relying on memory from this conversation.

Expected top group:

1. ChatGPT export
2. Claude export
3. Google My Activity / Gemini / Takeout
4. Gmail / email MBOX
5. GitHub issues, pull requests, reviews, commits, discussions
6. Slack export
7. Markdown / Obsidian / local docs
8. Google Calendar
9. Notion export / API pages
10. Wikimedia / Wikipedia / Wikidata

## Acceptance Criteria

- [ ] Catalogue names candidate sources and ranks them by value.
- [ ] Top 10 sources include links to official schema/export docs where available.
- [ ] Catalogue distinguishes personal continuity value from schema stress value.
- [ ] Wikimedia is represented as a family of sources, not one schema.
- [ ] Catalogue identifies which source should produce the first canonical event test.

## TDD Notes

- Red: write the expected catalogue/check first.
- Green: add only enough documented evidence to support the next source decision.
- Refactor: split source families only when the catalogue becomes unclear.
