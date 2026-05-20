# Agent Brief

This repository is intended to become the reusable intelligence layer for multiple applications.

## Product direction

The system should feel like:

- continuous memory
- continuous retrieval
- low-friction continuity
- ambient context assembly

The system should NOT feel like:

- a note-taking app
- a folder hierarchy
- a dashboard-heavy productivity suite
- manual knowledge management

## UX assumptions

Users should ideally only:

- speak
- pause
- resume

The system handles:

- segmentation
- organisation
- retrieval
- ranking
- summarisation
- continuity inference

## Key commands

Examples:

```txt
Resume tumble dryer discussion
Resume advert ideas
Resume boiler quote
Re kitchen redesign
Forget last 10 minutes
```

## Suggested early implementation priorities

1. Event ingestion pipeline
2. Transcript storage
3. Embedding generation
4. Semantic retrieval
5. Continuation inference
6. Resume command parsing
7. Continuation summary generation

## Strong recommendation

Do not build extensive UI infrastructure early.

The core value is inference quality and continuity quality.

## Suggested MVP

A minimal command-line or API-first implementation is acceptable initially.

Possible loop:

1. ingest transcript chunks
2. infer Continuation/topic
3. store embeddings + summaries
4. parse Resume command
5. retrieve likely context
6. generate continuation summary

## Future possibilities

- proactive spoken summaries
- driving mode
- unresolved task surfacing
- customer/job context augmentation
- wearable integrations
- passive life continuity systems

## Important philosophy

The user should not become the maintainer of the system.
