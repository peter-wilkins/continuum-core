# 085: Materialize Public Continuum Preview

Status: done

## Type

TDD.

## Context

The bootstrap source fetch now gives public documents, and scope evaluation separates active records from review candidates. The app still needs a small reusable path from public documents to paragraph-grounded Thought Cards.

This is a rebuildable materialized view. Public documents remain source truth; Lens outputs and Thought Cards are generated projections over included source records.

## What To Build

Add a core helper that materializes a public Continuum preview from:

- Import Scope
- Public Continuum Query
- public-document source records
- Knowledge Time for generation

Also add a local script that runs this helper over `data/bootstrap-public-sources`.

## First Failing Test

`materializes public documents into active Thought Cards and review candidates`

## Acceptance Criteria

- [x] Evaluate each public document against the Import Scope.
- [x] Keep active, review, and excluded records as event id lists rather than duplicated event payload lists.
- [x] Generate Source Paragraphs only for active source records.
- [x] Generate Lens outputs only from active events.
- [x] Generate Thought Cards from active Source Paragraphs.
- [x] Preserve review candidates for inspection.
- [x] Fail clearly when no active events can materialize.
- [x] Provide a local script for the fetched bootstrap source folder.

## Out Of Scope

- Database persistence.
- UI rendering.
- Activating needs-review records automatically.
- LLM-generated summaries.

## Verification

`node scripts/materialize-bootstrap-public-preview.mjs` over the fetched Wikipedia pack:

- events: 6
- active: 3
- review: 3
- excluded: 0
- source paragraphs: 58
- Lens outputs: 3
- Thought Cards: 174
