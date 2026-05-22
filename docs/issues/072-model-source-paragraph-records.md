# 072: Model Source Paragraph Records

Status: done

## Type

AFK.

## Context

Public MVP Thought Cards cite Source Paragraph records. Source Paragraphs preserve paragraph-level provenance for document-like public sources without making the importer generate cards directly.

## What Was Built

Add a required-field Source Paragraph domain model with validation. A Source Paragraph should point back to the canonical source event and carry enough locator/context data to retrieve, inspect, or verify the paragraph later.

## First failing test

`creates one Source Paragraph with a paragraph locator`

## Acceptance Criteria

- [x] Export a `SourceParagraph` model and constructor/validator.
- [x] Represent ids, timestamps, confidence/fingerprint-style values, and human text with named domain scalars/value objects rather than naked primitives where practical.
- [x] Require a canonical event id, source document id, paragraph index, source fingerprint, paragraph text, and explicit source context.
- [x] Reject blank paragraph text.
- [x] Reject negative or non-integer paragraph indexes.
- [x] Keep source context explicit; do not hide page title, source URL, license, retrieved time, source record id, or parser version in code assumptions.
- [x] Do not add character-range or line-range locators in this slice.

## Blocked by

None - can start immediately.

## Out Of Scope

- Splitting documents into paragraphs.
- Generating Thought Cards.
- Content-addressable storage.
- Database persistence.
