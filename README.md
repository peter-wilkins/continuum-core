# Continuum Core

Shared inference, memory, retrieval, and context-resume engine for apps such as **Jobs Done** and **Continuant**.

This repository is not primarily a UI project. It is the common intelligence layer for apps that want to feel as if they remember, resume, and surface context without making the human maintain a filing system.

## Product thesis

Most productivity software still makes the human act as the scheduler and database administrator:

- remember to capture
- remember to organise
- remember to search
- remember to review
- remember where something belongs

Continuum Core exists to remove that maintenance loop.

The target interaction is closer to:

> The human thinks, speaks, pauses, and resumes. The system maintains continuity around them.

## Two core promises

1. **The user does not have to decide when to capture.**
   Apps may choose always-on or intentionally-on capture modes, but the point is to avoid forcing the user to press save, name notes, create folders, or switch into software-operation mode.

2. **The user does not have to decide when to search.**
   Retrieval should happen continuously and proactively. The app should assemble useful context before the user realises they need to search.

## Important vocabulary

- **Resume**: user-facing command/protocol for re-entering a context stream. Example: `Resume tumble dryer discussion`.
- **Re:**: lightweight protocol marker inspired by email headers. It signals continuity without requiring literal folders or threads.
- **Stream**: an ongoing area of thought, work, job, customer, topic, or situation. Streams may be inferred; they do not need to be manually created.
- **Continuation state**: the assembled context needed to continue thinking or acting effectively.
- **No UI**: not literally no interface, but no visible maintenance burden. The interface should disappear into intent.

## Design principle

Do not build manual UI until the core has failed to infer something automatically.

Every manual control should be treated as an admission that inference, retrieval, ranking, or explanation is not yet good enough.

## Intended consumers

### Jobs Done

A trades/job-context app. It may use this core to infer current job context, retrieve prior customer/property/job notes, surface unresolved tasks, and support hands-free context before action.

### Continuant

A thought-continuity app. It may use this core to support ambient capture, automatic organisation, and spoken resume commands such as `Resume advert ideas` or `Resume boiler quote`.

## Initial module sketch

```txt
continuum-core/
  ingest/          # audio/text events in
  segment/         # split streams into useful thought/job units
  memory/          # summaries, embeddings, temporal memory
  retrieve/        # always-searching context engine
  infer/           # intent, topic, entity, task extraction
  protocol/        # Resume/Re commands and parsing
  adapters/        # app-specific wrappers
  docs/            # specs and agent briefs
```

## Read next

- [`docs/product-philosophy.md`](docs/product-philosophy.md)
- [`docs/protocol.md`](docs/protocol.md)
- [`docs/architecture.md`](docs/architecture.md)
- [`docs/agent-brief.md`](docs/agent-brief.md)
- [`docs/conversation-capture.md`](docs/conversation-capture.md)
