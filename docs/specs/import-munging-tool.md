# Continuum.Core Import Munging Tool Spec

## Name

`continuum-import`

## Purpose

Import messy external source material into Continuum's unified event model, safely, repeatably, and idempotently.

Primary value:

> Build an inspectable Continuum about extended thought, starting from public sources and explicit import scopes.

This is a reversible digestion pipeline for external cognition, not just a file importer. Private personal imports remain important, but they are no longer the MVP path.

## MVP Pivot

The MVP is not "Peter's personal Continuum" and not "import all my private history".

The MVP is a public, bootstrapped Continuum about extended thought:

- users can explore a Continuum around a person, topic, artefact, or intellectual tradition;
- the app can capture feedback while users explore what Continuum could become;
- public data keeps iteration easier, safer, and easier to demo;
- private personal imports move behind public-data import, curation, feedback, and membrane learning.

Example target:

```text
Import Ada Lovelace into this Continuum.
Import everything Ada Lovelace said about computers.
```

That means import becomes **identity-first** and **focus-identity-filtered** before parsing source records.

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
- Identity-first: broad source dumps are secondary to explicit import scopes.
- Public-first MVP: prefer public, licensed, inspectable data before private personal archives.

## Supported Sources

Private/personal parser coverage:

- Claude export: real local sample validates and imports.
- ChatGPT export: fixture/import path exists, but real export is postponed.
- Email/MBOX: model pressure fixture exists.
- Git commits: fixture parses and imports one commit.
- Calendar/iCalendar: fixture imports one calendar event.
- Markdown/local docs: fixture imports one document snapshot.
- Google Chrome history: Takeout/Data Portability fixture imports one browser visit.
- Google Chrome bookmarks: Takeout/Data Portability fixture imports one saved reference.
- Google Chrome reading list: Takeout/Data Portability fixture imports one saved reference.
- Google My Activity: fixture imports YouTube, Search, and Maps activity records.
- Wikimedia/Wikidata entity: Ada Lovelace public fixture imports as one canonical event.
- Public document: Project Gutenberg Analytical Engine fixture imports as one canonical event with explicit license/provenance metadata.
- Wikimedia/MediaWiki revision: public sample fixture exists.

Public MVP direction:

- Identity pages and aliases: Wikidata/Wikipedia/MediaWiki.
- Public writings and letters: Wikisource, Project Gutenberg, Internet Archive, library/archive metadata.
- Public collaboration and discussion: GitHub issues, pull requests, reviews, discussions.
- Topic-specific corpora: source records filtered by identity plus subject before promotion.

Catalogue targets:

- GitHub issues, PRs, reviews, commits, discussions.
- Slack export.
- Google Contacts.
- precise Google location timeline/trips.
- Chrome Autofill, extensions, settings, dictionary, and other non-event exports.
- Notion export/API pages.

Source ranking and evidence links live in `docs/source-catalogue.md`.

## Pipeline

```text
import scope
  -> identity candidates
  -> topic/source filters
  -> raw file, archive, or API page
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
    platform: "chatgpt" | "claude" | "email" | "git" | "google_activity" | "google_chrome" | "icalendar" | "markdown" | "public_archive" | "wikimedia";
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
    role: "sender" | "recipient" | "cc" | "bcc" | "reply_to" | "attendee" | "author";
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

## Local Source Cache

The first local serving store should be a **Local Source Cache** owned by the Host App, not by Continuum Core.

Continuum Core owns the contract and transformation helpers. The Host App owns the concrete SQLite dependency, database file, backend routes, and rebuild lifecycle.

The first cache shape should be flat event rows plus full JSON:

```sql
local_source_events(
  id text primary key,
  sourcePlatform text not null,
  sourceName text not null,
  sourceKey text not null,
  externalConversationId text not null,
  externalMessageId text not null,
  createdAt text not null,
  createdAtConfidence text not null,
  ingestedAt text not null,
  actorRole text not null,
  subject text,
  text text not null,
  eventJson text not null
)
```

This is enough for early timelines, source filters, search probes, and event detail views while preserving the full Canonical Event. It is deliberately not an identity graph, conversation model, entity store, or Memory Layer.

Use the same camelCase field names in TypeScript and SQLite. Avoid camelCase-to-snake_case conversion at this boundary; it adds boilerplate and creates a bug surface. SQLite accepts these identifiers directly, and the Host App may quote them with double quotes if needed.

The `text` column is intentionally duplicated from `eventJson` so the Host App can serve timelines, simple search, and later SQLite FTS without reparsing every event. Because it is readable payload data, the Local Source Cache must be purged or rebuilt after Forget Requests and erasure operations.

`createdAt` is event time: when the source event happened. `ingestedAt` is ingest/cache time: when Continuum learned about it or rebuilt the local row. Both are required because imported history often arrives long after it happened.

SQLite FTS is not part of the first Local Source Cache slice. Add it after the basic timeline, source filtering, and event detail path is working, and test that erasure purges both base rows and FTS rows.

## Source Truth And Lenses

Do not duplicate state unless there is an explicit exception.

The preferred shape is:

```text
source truth
  -> Lens parameters
  -> ordered source ids
  -> rebuildable surface
```

For generated Lens outputs, prefer storing:

- scope id
- query id
- Lens id
- Lens version
- ordered Canonical Event or Entry ids
- section structure
- provenance and generation parameters

The first core model exposes Atlas, Loom, and Beacon as default public Lens definitions. A `LensOutput` stores ordered event ids and section event ids; it does not store copied event payload text.

Lens feedback is evidence about one scope/query/candidate set:

- user id
- scope id
- query id
- selected Lens output id
- candidate Lens output ids
- created time

It is not a user settings system in the MVP.

Public Continuum queries are explicit records tied to an Import Scope. The initial MVP query for the Ada scope can be seeded by the system, but it remains a query record rather than hidden product state.

Avoid copying whole event payloads or treating generated text as durable truth. If generated text is stored for page-load stability or release repeatability, mark it as rebuildable and keep the source ids needed to regenerate it.

Import batch provenance should use a link table rather than an `import_batch_id` column on events. A Canonical Event can be observed by multiple imports over time, especially during reimport, so batches observe events; they do not own them.

```sql
local_import_batches(
  id text primary key,
  sourcePlatform text not null,
  sourceName text not null,
  originalFilename text not null,
  originalFileHash text not null,
  createdAt text not null,
  statsJson text not null,
  batchJson text not null
)

local_import_batch_events(
  batchId text not null,
  eventId text not null,
  importStatus text not null check (
    importStatus in ('new', 'known', 'changed', 'uncertain')
  ),
  primary key (batchId, eventId)
)

local_import_quarantine(
  id text primary key,
  batchId text not null,
  sourcePath text not null,
  recordIndex integer,
  errorCode text not null,
  message text not null,
  quarantineJson text not null
)
```

Quarantine records live separately because malformed records may not produce Canonical Event ids. Do not make `eventId` nullable to mix successful event observations with failed records.

First slice indexes should stay operational:

```sql
create index local_source_events_created_at_idx
  on local_source_events(createdAt);

create index local_source_events_source_platform_idx
  on local_source_events(sourcePlatform);

create index local_import_batch_events_event_id_idx
  on local_import_batch_events(eventId);
```

Do not add semantic, vector, or FTS indexes in the first Local Source Cache slice.

The Host App should store the SQLite file under gitignored local data, for example:

```text
continuum/data/local-source-cache.sqlite
```

Continuum Core experiments may use:

```text
continuum-core/data/run-current/local-source-cache.sqlite
```

The database is disposable and rebuildable from import artifacts. Do not commit it.

The Local Source Cache should remain a bridge toward Parquet/Arrow memory strata. Keep first-class columns stable and exportable; avoid app-only shapes that cannot become columnar.

First likely future stratum partition:

```text
event_month = created_at YYYY-MM
```

Future path:

```text
local_source_events
  -> parquet/source-events/event_month=2026-05/*.parquet
  -> Arrow working set for interpreters
```

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
  | "intentional_context";
```

Rules:

- `everything`: include every valid source record.
- `clean_default`: broad local intake that excludes obvious junk/promotional/bulk records and includes ordinary records, including passive activity.
- `intentional_context`: high-signal memory intake that includes records showing deliberate user intent, with source-specific rules.

Import profiles must treat account history as evidence, not truth. A vendor account may contain passive activity, autoplay, shared-device use, children using a parent's account, background media, mistakes, curiosity clicks, or other messy human behaviour. Import filtering should therefore avoid assuming every source record represents the account holder's intent.

Email `intentional_context` uses an engaged contacts rule and is two-pass:

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

For user-facing email controls, call this `engaged_contacts` because that is clearer than the generic profile name.

YouTube `intentional_context` treats watch history as weak evidence:

- search activity -> include
- liked, saved, commented, uploaded, or deliberately subscribed activity -> include
- watch history alone -> `needs_review`
- watch history with stronger supporting evidence -> include

The reason is that watch history can be polluted by autoplay, shared-account use, background media, or children using the account. Weak evidence should remain inspectable without automatically becoming high-signal memory.

`clean_default` may still import YouTube watch history locally unless it looks like obvious junk; `intentional_context` is where watch history becomes `needs_review` by default.

Google `intentional_context` uses the same principle across products:

- strong intent -> include
- passive activity -> `needs_review`
- passive activity with stronger supporting evidence -> include
- sensitive or high-risk data -> keep local/raw until the relevant membrane and domain model exist

Examples of strong intent include searches, bookmarks, reading-list saves, contacts edited by the user, calendar events, map searches, and requested directions. Examples of passive activity include ordinary Chrome browsing history, YouTube watch history, passive location timeline points, app opens, and background activity.

This keeps "import broadly for inspection" separate from "allow this record to shape memory and retrieval."

Import filter actions are real states, not only preview labels:

- `include`: import/promote the record so it can become memory and retrieval material.
- `exclude`: do not import/promote the record under this profile.
- `needs_review`: retain the record locally for inspection, but do not make it memory-active until the user approves it or stronger evidence promotes it.

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

## User Instructions: Google Takeout

Open this link:

https://takeout.google.com/

Steps:

1. Click `Deselect all`.
2. Select the Google products to inspect.
3. Deselect `Flow` / `Your images and videos from Google Flow`.
4. Click `Next step`.
5. Use:
   - Destination: `Send download link via email`
   - Frequency: `Export once`
   - File type: `.zip`
   - File size: `50 GB`
6. Click `Create export`.
7. Wait for Google's email.
8. Download every zip part into local private storage.

Expected result: the user has local `.zip` files that can be dry-run inspected before any records become memory-active.

Current MVP:

```bash
continuum-import inspect claude <conversations.json>
continuum-import dry-run claude <conversations.json> --out <preview.json>
continuum-import dry-run public-document <document.json> --scope <scope.json> --out <preview.json>
continuum-import chatgpt <conversations.json> --out <events.jsonl>
continuum-import claude <conversations.json> --out <events.jsonl>
continuum-import git-log <git-log.txt> --out <events.jsonl>
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
- import profile summaries:
  - included
  - excluded
  - needs review
  - reasons such as `strong_user_intent`, `weak_passive_activity`, `promotional_or_bulk`, and `no_prior_engagement`
- event-level filter decisions and memory-active flags

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
- Markdown normalizes one local document snapshot.
- CLI supports `markdown` files and routes Markdown files inside Takeout folders/zips.
- Git log parses and imports one commit.
- CLI supports `git-log` files and routes `.gitlog` files inside folder/zip imports.

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
