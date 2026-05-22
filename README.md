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

- **Resume**: user-facing command/protocol for re-entering a Continuation. Example: `Resume tumble dryer discussion`.
- **Re:**: lightweight protocol marker inspired by email headers. It signals continuity without requiring literal folders or threads.
- **Continuation**: an ongoing and potentially unbounded area of thought, work, job, customer, topic, or situation. Continuations may be inferred; they do not need to be manually created.
- **Resume Brief**: the assembled context needed to continue thinking or acting effectively at a specific moment.
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
  segment/         # split capture into useful thought/job units
  memory/          # summaries, embeddings, temporal memory
  retrieve/        # always-searching context engine
  infer/           # intent, topic, entity, task extraction
  protocol/        # Resume/Re commands and parsing
  adapters/        # app-specific wrappers
  docs/            # specs and agent briefs
```

## Schema workbench

Run a local visual inspector for the canonical event schema:

```bash
npm run schema:dev
```

Open the local URL printed by Vite, usually:

```text
http://127.0.0.1:5173/
```

If that port is busy, Vite prints the next available port. The page reloads when schema files change.

## Import CLI

Build the CLI:

```bash
npm run build
```

Get a Google Takeout zip for Continuum:

1. Open this link: https://takeout.google.com/
2. Click `Deselect all`.
3. Select the Google products you want Continuum to inspect.
4. Deselect `Flow` / `Your images and videos from Google Flow`.
5. Click `Next step`.
6. Use these export settings:
   - Destination: `Send download link via email`
   - Frequency: `Export once`
   - File type: `.zip`
   - File size: `50 GB`
7. Click `Create export`.
8. Wait for Google's email, then download every zip part into a local `data/import-samples/` folder.

Expected result: you have one or more `.zip` files that stay local and can be inspected before anything becomes memory-active.

Inspect a Google Takeout zip before importing:

```bash
node dist/cli.js inspect google-takeout-zip data/google/takeout.zip
```

Write a local dry-run preview:

```bash
node dist/cli.js dry-run google-takeout-zip data/google/takeout.zip --out data/google/preview.json
```

Write a public dry-run preview with an explicit Import Scope:

```bash
node dist/cli.js dry-run public-document src/fixtures/project-gutenberg-analytical-engine-public-document.json --scope src/fixtures/import-scope-ada-lovelace-computing.json --out data/public-preview.json
```

Import into local JSONL:

```bash
node dist/cli.js google-takeout-zip data/google/takeout.zip --out data/google/events.jsonl
```

Supported source names:

- `claude`
- `chatgpt`
- `email-mbox`
- `google-chrome-history`
- `google-chrome-bookmarks`
- `google-chrome-reading-list`
- `google-my-activity`
- `icalendar`
- `markdown`
- `git-log`
- `mediawiki-revisions`
- `google-takeout-folder`
- `google-takeout-zip`

Raw data, previews, and event JSONL should stay under `data/`, which is gitignored.

## Using From Another TypeScript Project

Until this package is published, install it from a sibling checkout:

```bash
npm install ../continuum-core
```

Then import from the package root:

```ts
import {
  createAmbiguousResumeSurface,
  createImportedEntryFromCanonicalEvent,
  debugRankingProfiles,
  retrieveContinuationCandidates,
} from "@continuum/core";
```

For app-facing retrieval experiments, prefer `createAmbiguousResumeSurface`.
Use `narrowSpreadThreshold: 0.1` as the MVP/debug starting value; lower values make ambiguity less likely, higher values make it more likely.

```ts
const surface = createAmbiguousResumeSurface({
  resumeRequest,
  entries,
  rankingProfile: debugRankingProfiles.balanced,
  narrowSpreadThreshold: 0.1,
});
```

## Read next

- [`docs/product-philosophy.md`](docs/product-philosophy.md)
- [`docs/protocol.md`](docs/protocol.md)
- [`docs/architecture.md`](docs/architecture.md)
- [`docs/agent-brief.md`](docs/agent-brief.md)
- [`docs/agent-mailbox/README.md`](docs/agent-mailbox/README.md)
- [`docs/conversation-capture.md`](docs/conversation-capture.md)
