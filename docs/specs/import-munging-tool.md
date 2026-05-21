# Continuum.Core Import Munging Tool Spec

## Name

`continuum-import`

## Purpose

Import messy external AI/chat/personal-data exports into Continuum's unified event model, safely, locally, repeatably, and idempotently.

Primary value:

> Bring existing thinking history into a private local core. Let nothing leave until a membrane allows it.

This is a reversible digestion pipeline for external cognition, not just a file importer.

## Current Principles

- Local-first: raw imports and previews stay local by default.
- Immutable events: changes produce later events or tombstones, not silent mutation.
- Required fields: public types avoid optional inputs and surprise defaults.
- Explicit absence: use `null`, empty arrays, or `"unknown"` instead of omission.
- Provenance-first: every event records source lineage at ingestion time.
- Fingerprints detect changed source records; they do not prove independent evidence.
- Zod validates unstable source schemas before normalization.
- Bad records should be quarantined, not allowed to corrupt canonical events.
- Membranes control disclosure to prompts, sync, exports, logs, docs, and people.
- Storage-adapter first: do not bake SQLite/Postgres/Supabase into core contracts yet.

## Supported Sources

Active/imported:

- Claude export: real local sample validates and imports.
- ChatGPT export: fixture/import path exists, but real export is postponed.
- Email/MBOX: model pressure fixture exists.
- Wikimedia/MediaWiki revision: public sample fixture exists.

Catalogue targets:

- Git commits.
- GitHub issues, PRs, reviews, commits, discussions.
- Calendar/iCalendar.
- Slack export.
- Markdown/Obsidian/local docs.
- Google My Activity/Gemini/Takeout.
- Notion export/API pages.

Source ranking and evidence links live in `docs/source-catalogue.md`.

## Pipeline

```text
raw file or archive
  -> import batch
  -> source adapter
  -> Zod-validated source records
  -> canonical events
  -> protected payloads
  -> dedupe/reimport report
  -> local preview
  -> membrane decision
  -> approved sync/export package
```

Hard rule:

> Never import straight into memory.

Derived memory, summaries, embeddings, previews, and search indexes are rebuildable views.

## Canonical Event Shape

The implementation source of truth is `src/index.ts`. The visual schema source is `src/schema/canonical-event-schema.ts`.

Current fields:

```ts
type CanonicalEvent = {
  id: string;

  source: {
    platform: "chatgpt" | "claude" | "email" | "wikimedia";
    key: string;
    fingerprint: string;
    externalConversationId: string;
    externalMessageId: string;
    artifactId: string | null;
    externalParentId: string | null;
    canonicalParentEventId: string | null;
  };

  provenance: {
    sourceFamily: string;
    sourceName: string;
    upstreamSources: string[];
    derivedFrom: string[];
    retrievedAt: string;
    license: string | null;
  };

  time: {
    createdAt: string;
    createdAtConfidence: "exact" | "inferred" | "unknown";
  };

  actor: {
    role: "user" | "assistant" | "system" | "tool" | "other";
  };

  participants: Array<{
    role: "sender" | "recipient" | "cc" | "bcc" | "reply_to";
    name: string | null;
    address: string;
  }>;

  content: {
    kind: "text";
    subject: string | null;
    text: string;
  };
};
```

## Identity And Reimport

Source identity:

```text
source.key = platform + source grouping id + source record id
```

Examples:

```text
chatgpt:conversation_id:message_id
claude:conversation_uuid:message_uuid
email:<message-id>
en.wikipedia.org:revision:revision_id
```

Source fingerprint:

- Used to detect same-key changed records.
- Used for idempotent reimport reports.
- Not used as proof of independent evidence.

Reimport report:

```ts
type ImportReport = {
  new: number;
  known: number;
  changed: number;
  uncertain: number;
};
```

Current behavior:

- same key + same fingerprint -> `known`
- new key -> `new`
- same key + different fingerprint -> `changed`
- conflicting duplicate groups -> `uncertain`
- no canonical event is silently overwritten

Future behavior:

- same key + changed content should create explicit revision records
- malformed records should be quarantined and counted, not fatal

## Provenance And Consensus

Every event has provenance at ingestion time.

Consensus rule:

> Never treat two records as independent unless their upstream lineage differs.

Reason:

- same facts can be reworded
- exact text can be copied
- DBpedia/Wikidata/Wikipedia can share upstream lineage
- search snippets and AI summaries are derived evidence, not source evidence

`countIndependentEvidence` uses lineage, not content hash.

## Privacy Membranes

Privacy docs live in `docs/membranes.md`.

Core rule:

> Immutable does not mean readable forever.

Current protected payload model:

- encrypt payload with per-payload AES-256-GCM key material
- erase by removing key material
- retain tombstone metadata
- block erased or missing payloads at disclosure membrane
- record membrane decision

Later hardening:

- store key material outside event records
- purge derived indexes/caches/previews on erasure
- replay erasure ledger after restore
- add prompt/export/share policies

## Zod Boundary

Use Zod at adapter boundaries.

Rules:

- source schemas are adapter-local and vendor-controlled
- canonical event schema is internal/product-controlled
- use `safeParse`
- return path/message validation errors
- do not let malformed source records reach normalizers
- next step: quarantine bad records instead of failing whole CLI command

Implemented:

- Claude conversation export validation.

Pending:

- ChatGPT validation when real export arrives.
- Email/MBOX parsed record validation.
- Wikimedia response validation.
- Quarantine model.

## CLI

Current MVP:

```bash
continuum-import chatgpt <conversations.json> --out <events.jsonl>
continuum-import claude <conversations.json> --out <events.jsonl>
```

Current output:

```text
Wrote N new events to <path>
Report new=N known=N changed=N uncertain=N
```

Planned commands:

```bash
continuum-import inspect <file-or-archive>
continuum-import dry-run <file-or-archive> --store <local-store>
continuum-import approve <batch-id>
continuum-import sync <batch-id> --target <target>
```

## Import Batch Model

Not implemented yet.

Needed because reimport with timestamped files should report at both levels:

- batch identity: exact file/archive hash
- record identity: source key + fingerprint
- validation stats
- quarantine stats
- import provenance

Proposed required shape:

```ts
type ImportBatch = {
  id: string;
  sourcePlatform: string;
  sourceName: string;
  originalFilename: string;
  originalFileHash: string;
  createdAt: string;
  completedAt: string | null;
  status: "parsed" | "normalized" | "previewed" | "approved" | "failed";
  stats: {
    filesSeen: number;
    recordsSeen: number;
    eventsCreated: number;
    eventsKnown: number;
    eventsChanged: number;
    eventsUncertain: number;
    recordsQuarantined: number;
    warnings: number;
  };
};
```

## Quarantine Model

Not implemented yet.

Bad records should not kill an import.

```ts
type ImportErrorRecord = {
  importBatchId: string;
  sourcePath: string;
  recordIndex: number | null;
  errorCode: string;
  message: string;
  recoverable: boolean;
};
```

Do not store large raw snippets in committed fixtures or logs. For local-only tooling, snippets may be useful, but they must remain behind membranes.

## Preview UI Requirements

Before anything leaves local core, show:

- new vs known vs changed vs uncertain
- validation/quarantine errors
- provenance family and overlap warnings
- timeline density
- participants/entities/projects
- sensitive candidates
- erased/excluded items
- membrane decisions

User actions:

- approve all visible
- exclude event/source/date/topic
- keep local only
- erase payload
- delete raw import artifact
- export/sync approved package

## MVP Acceptance Criteria

Done:

- Claude export normalizes into canonical events.
- Claude real local export imports idempotently.
- ChatGPT fixture imports idempotently.
- Zod validates Claude before normalization.
- event provenance is preserved.
- privacy membrane can block erased payloads.
- raw exports remain local by default.
- dedupe report is understandable.

Next:

- malformed records are quarantined, not fatal.
- import batches record file/archive identity.
- inspect/dry-run commands exist.
- preview model exists before sync/export.
- source adapters move out of one large `src/index.ts`.

## Design Principle

Do not build "an importer."

Build:

> A reversible digestion pipeline for external cognition.

The user is not moving files. They are letting Continuum metabolise their existing thinking history without losing privacy, provenance, or deletion rights.
