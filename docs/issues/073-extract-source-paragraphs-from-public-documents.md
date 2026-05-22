# 073: Extract Source Paragraphs From Public Documents

Status: done

## Type

AFK.

## Context

The public MVP needs paragraph-level provenance for Wikipedia-style and public-document sources. Existing public document import creates canonical events, but Thought Cards need Source Paragraph records to cite.

## What Was Built

Add a deterministic helper that extracts Source Paragraph records from one public document source record or its normalized canonical event, preserving paragraph order and explicit source context.

## First failing test

`extracts Source Paragraphs from one public document`

## Acceptance Criteria

- [x] Split one public document text into non-blank Source Paragraphs.
- [x] Preserve paragraph order using paragraph indexes.
- [x] Generate deterministic Source Paragraph ids from stable source identity and paragraph index.
- [x] Generate a source fingerprint for each paragraph or its referenced source text/version.
- [x] Preserve explicit source context on each Source Paragraph.
- [x] Re-running extraction for unchanged input produces the same ids and fingerprints.
- [x] Do not generate Thought Cards in this slice.

## Blocked by

- [072: Model Source Paragraph Records](072-model-source-paragraph-records.md)

## Out Of Scope

- Arbitrary HTML parsing.
- Wikipedia API fetching.
- Character-count and line-count locators.
- Database persistence.
