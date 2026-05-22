# Continuum MVP Development Epics

This document captures the emerging development sequence for Continuum.

The important principle is:

Build continuity first.
Do not prematurely build the full cognition operating system.

---

# Epic 1 — Unified Import Pipeline

## Goal
Import fragmented historical cognition into a unified event model.

## Why
Continuity already partially exists across:

- ChatGPT exports
- Claude exports
- email
- markdown
- GitHub
- notes
- voice transcripts
- documents
- chats

The importer is not a side utility. It is foundational.

## Outcomes

- unified event stream
- identity resolution
- chronology reconstruction
- deduplication
- canonical event model
- embeddings and references

## Success Metric

"My fragmented thinking history now exists in one place."

---

# Epic 2 — Continuity Retrieval

## Goal
Recover and continue abandoned thoughts naturally.

## Why
This is the first real product test.

The system must feel like cognitive continuation, not keyword search.

## Example Interactions

- What was I thinking about?
- Continue that idea from last week.
- Find the thing about membranes.
- Show related continuations.
- What ideas keep resurfacing?
- What did I abandon?

## Technical Areas

- chronology
- semantic retrieval
- embeddings
- clustering
- ranking
- narrative continuity

## Success Metric

"Holy shit, it found the thought I lost."

---

# Epic 3 — Continuation Surfaces

## Goal
Reduce entropy automatically by generating useful projections over cognition.

## Examples

- evolving summaries
- concept clusters
- unresolved tensions
- recurring themes
- narrative timelines
- relationship graphs
- materialized views

## Principle

Documents are projections, not the source of truth.

The source of truth is the event stream plus concept graph.

---

# Epic 4 — Active Capture

## Goal
Capture new cognition directly into the living continuum.

## Post-MVP Priority
Start with audio capture and correction feedback because it directly improves the dogfooding workflow and the quality of daily Continuum input.

Platform capture should stay host-owned. Android, Linux, browser, and future native shells should capture audio using their local mechanisms. Continuum should define the shared processing boundary after audio exists: Audio Artifacts, Audio Processing Jobs, Raw Transcript Text, tone/prosody/intent observations, and membranes around raw recordings.

## Inputs

- voice
- text
- screenshots
- future modalities

## Principle

Capture only becomes meaningful once retrieval and continuity already work.

Otherwise the system becomes another dead note app.

---

# Epic 5 — Shared Continuums

## Goal
Preserve interaction continuity for small trusted groups.

## Initial Scope

- pairs
- small teams
- project continuums

## Focus

- continuity of interactions
- shared rationale
- decision lineage
- safe collaboration

Not large organizations initially.

---

# Epic 6 — Membranes and Governance

## Goal
Enable safe cognition flow between continuums.

## Includes

- negotiated boundaries
- selective permeability
- compression membranes
- disclosure review
- traceable abstraction
- auditability
- abuse resistance

## Principle

Do not overbuild governance before real sharing pain exists.

---

# Guiding Principle

Importer → Retrieval → Continuation

Everything else grows outward from there.
