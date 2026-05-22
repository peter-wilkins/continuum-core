# 064: Import One Public Document

Status: done

## Type

AFK.

## Context

The public MVP needs source text, not only identity records. Project Gutenberg gives a public archive source for the Ada Lovelace / Analytical Engine material without touching private user data.

The first slice uses an explicit metadata wrapper instead of guessing license, date, and provenance from arbitrary HTML.

## What Was Built

Import one required-metadata public document source record into the canonical event model.

## First Failing Test

`imports one public-domain document into the canonical event model`

## Acceptance Criteria

- [x] Add `PublicDocumentNormalizationInput`.
- [x] Require source platform, family, source name, source id, source URL, retrieved time, license, upstream lineage, and derived lineage.
- [x] Require title, language, publication time, time confidence, creators, subject tags, and text.
- [x] Normalize one Project Gutenberg Ada / Analytical Engine source record into one `CanonicalEvent`.
- [x] Preserve author/translator attribution as participants.
- [x] Reject public documents without explicit license metadata.
- [x] Wire `public-document` into the import CLI.

## Out Of Scope

- Fetching Project Gutenberg HTML/RDF directly from the CLI.
- Parsing arbitrary public HTML.
- Splitting one long public document into many event chunks.
- Resolving works, authors, translators, and topics into a full identity graph.

## Notes

This is a prepared-source-record importer. A later fetcher can turn Project Gutenberg, Wikisource, Internet Archive, or library metadata into this required shape.
