# 073: Extract Source Paragraphs From Public Documents

Status: ready

## Type

AFK.

## Context

The public MVP needs paragraph-level provenance for Wikipedia-style and public-document sources. Existing public document import creates canonical events, but Thought Cards need Source Paragraph records to cite.

## What to build

Add a deterministic helper that extracts Source Paragraph records from one public document source record or its normalized canonical event, preserving paragraph order and explicit source context.

## First failing test

`extracts Source Paragraphs from one public document`

## Acceptance Criteria

- [ ] Split one public document text into non-blank Source Paragraphs.
- [ ] Preserve paragraph order using paragraph indexes.
- [ ] Generate deterministic Source Paragraph ids from stable source identity and paragraph index.
- [ ] Generate a source fingerprint for each paragraph or its referenced source text/version.
- [ ] Preserve explicit source context on each Source Paragraph.
- [ ] Re-running extraction for unchanged input produces the same ids and fingerprints.
- [ ] Do not generate Thought Cards in this slice.

## Blocked by

- [072: Model Source Paragraph Records](072-model-source-paragraph-records.md)

## Out Of Scope

- Arbitrary HTML parsing.
- Wikipedia API fetching.
- Character-count and line-count locators.
- Database persistence.
