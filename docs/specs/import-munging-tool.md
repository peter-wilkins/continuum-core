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
- Calendar/iCalendar: fixture imports one calendar event.
- Google Chrome history: Takeout/Data Portability fixture imports one browser visit.
- Google Chrome bookmarks: Takeout/Data Portability fixture imports one saved reference.
- Google Chrome reading list: Takeout/Data Portability fixture imports one saved reference.
- Google My Activity: fixture imports YouTube, Search, and Maps activity records.
- Wikimedia/MediaWiki revision: public sample fixture exists.

Catalogue targets:

- Git commits.
- GitHub issues, PRs, reviews, commits, discussions.
- Slack export.
- Markdown/Obsidian/local docs.
- Google Contacts.
- precise Google location timeline/trips.
- Chrome Autofill, extensions, settings, dictionary, and other non-event exports.
- Notion export/API pages.

Source ranking and evidence links live in `docs/source-catalogue.md`.

## Pipeline

```text
raw file or archive
  -> import batch
  -> source adapter
  -> Zod-validated source records
  -> scan pass / import profile
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
    platform: "chatgpt" | "claude" | "email" | "google_activity" | "google_chrome" | "icalendar" | "wikimedia";
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
- import command should persist/import batch records through a storage adapter

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

## Import Profiles

Import profiles let the user export broadly from vendor tools and filter locally.

Profiles:

```ts
type ImportProfile =
  | "everything"
  | "clean_default"
  | "engaged_contacts";
```

Rules:

- `everything`: include every valid source record.
- `clean_default`: exclude obvious junk/promotional/bulk records, include ordinary records.
- `engaged_contacts`: include records involving people/threads the user engaged with.

Email `engaged_contacts` is two-pass:

1. Scan pass builds an engagement index:
   - user addresses
   - addresses the user sent to
   - threads the user participated in
2. Import pass decides:
   - sent by user -> include
   - sender user replied to -> include
   - same thread as sent reply -> include
   - promotional/bulk -> exclude
   - no prior engagement -> exclude

This avoids making the user fight Google Takeout selection UI while still keeping junk out of canonical events by default.

## Zod Boundary

Use Zod at adapter boundaries.

Rules:

- source schemas are adapter-local and vendor-controlled
- canonical event schema is internal/product-controlled
- use `safeParse`
- return path/message validation errors
- do not let malformed source records reach normalizers
- quarantine bad records instead of failing whole CLI command

Implemented:

- Claude conversation export validation.
- Claude conversation quarantine.

Pending:

- ChatGPT validation when real export arrives.
- Email/MBOX parsed record validation.
- Wikimedia response validation.

## CLI

Current MVP:

```bash
continuum-import inspect claude <conversations.json>
continuum-import dry-run claude <conversations.json> --out <preview.json>
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
continuum-import approve <batch-id>
continuum-import sync <batch-id> --target <target>
```

## Import Batch Model

Implemented first for Claude dry-run previews.

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

Implemented first for Claude conversation records.

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

Current dry-run preview includes:

- import batch
- new/known/changed/uncertain report
- quarantine records
- source file summaries
- event summaries
- warning counts for skipped unsupported files

Later previews should include import profile summaries:

- included
- excluded
- needs review
- reasons such as `promotional_or_bulk` and `no_prior_engagement`

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
- Claude malformed conversations are quarantined.
- Claude inspect command reports importable counts.
- Claude dry-run writes a local preview JSON.
- email import profiles can include engaged contacts and exclude promotional/unreplied messages.
- Google Chrome history validates and imports one browser visit as attention evidence.
- Google Chrome bookmarks parse and import one saved reference.
- Google Chrome reading list parses and imports one saved reference.
- Google My Activity validates and imports YouTube, Search, and Maps activity records.
- CLI supports Google Chrome history, bookmarks, reading list, and My Activity files.
- CLI inspect can walk a Google Takeout folder and route known files.
- CLI dry-run can preview a Google Takeout folder across known files.
- CLI import can write a Google Takeout folder idempotently.
- Malformed files inside a Google Takeout folder are quarantined without aborting the folder.
- Unsupported files inside a Google Takeout folder are skipped as warnings, not validation errors.
- Import results report warning counts and ignore their own output file during folder reimport.
- Malformed single JSON source files are quarantined during dry-run instead of throwing before preview.
- Google Takeout folder JSON files can be classified by schema when filenames are generic.
- Inspect results include source-file routing summaries for Takeout folders.
- CLI dry-run can read Google Takeout zip files with the same source classifier.
- CLI inspect/import can read Google Takeout zip files idempotently.
- CLI terminal output prints warning counts and source-file counts.
- Malformed Google Takeout zip files are quarantined during dry-run instead of crashing.
- iCalendar parses and imports one calendar event.
- CLI supports `icalendar` files and routes `.ics` files inside Takeout folders/zips.
- CLI iCalendar imports preserve the source file path as the source grouping id.

Next:

- persist import batches through a storage adapter.
- richer source routing for additional Takeout products.
- inspect/dry-run support for remaining later sources.
- richer preview model before sync/export.
- source adapters move out of one large `src/index.ts`.
- define identity graph before importing Google Contacts.
- define stricter location membranes before importing precise Maps/location timeline data.
- classify Chrome Autofill/settings/extensions/dictionary before importing non-event configuration and secrets-adjacent data.

## Design Principle

Do not build "an importer."

Build:

> A reversible digestion pipeline for external cognition.

The user is not moving files. They are letting Continuum metabolise their existing thinking history without losing privacy, provenance, or deletion rights.
