# Continuum.Core Import Munging Tool Spec

## Name

`continuum-import`

## Purpose

Import messy external AI/chat/personal-data exports into Continuum's unified event model, safely, locally, repeatably, and idempotently.

Primary value:

> Bring your existing AI history. Preview it privately. Sync only what you approve.

This should be treated as a reversible digestion pipeline for external cognition, not just a file importer.

---

## Supported sources: MVP

### 1. ChatGPT export

Expected input examples:

```text
chatgpt-export.zip
conversations.json
chat.html
user.json
```

Known shape:

```text
Conversation
  -> mapping
    -> message node
      -> message
      -> parent
      -> children
```

Special handling:

- Message graph, not simple linear transcript.
- Branches and regenerations.
- Assistant, user, system, and tool messages.
- Possible attachments or multimodal placeholders.
- Conversation title.
- Create and update timestamps.

### 2. Claude export

Expected input examples:

```text
claude-export.zip
*.json
```

Special handling:

- JSON conversation export.
- Model metadata may be incomplete or inconsistent.
- Edited or regenerated conversations may need fuzzy handling.
- Project/workspace context may exist depending on export.

### 3. Gemini / Google Takeout-style export

Expected input examples:

```text
takeout.zip
My Activity / Gemini / Bard / Assistant / Search activity
HTML / JSON / Takeout folders
```

Special handling:

- Likely less clean than ChatGPT or Claude exports.
- May contain activity records rather than full rich conversation state.
- Timestamps are important.
- Source confidence may vary.
- Parser should degrade gracefully.

### 4. Markdown folder

Expected input examples:

```text
folder/**/*.md
folder/**/*.txt
```

Special handling:

- Use file path as weak source identity.
- Use file modified time as fallback timestamp.
- Split into document events and chunk events.
- Preserve headings as structural hints.

---

## Later supported sources

Design adapters for:

```text
Obsidian vaults
Apple Notes export
Google Docs export
WhatsApp exports
Telegram exports
Signal exports
email mbox
Gmail API/import
voice notes + transcript JSON
Otter exports
Notion exports
Readwise exports
GitHub issues/discussions/commits
browser history
calendar events
```

Do not special-case Continuum around AI chats. Treat AI chats as one kind of cognitive event stream.

---

## Core concept

External exports become:

```text
RawImportArtifact
  -> SourceConversation
    -> SourceMessage
      -> ContinuumEvent
        -> DerivedMemory
```

Hard rule:

> Never import straight into memory.

Use stages:

```text
raw file
  -> parsed source records
  -> canonical events
  -> preview model
  -> approved sync package
  -> server memory
```

---

## Unified Continuum model

### `ContinuumEvent`

```ts
type ContinuumEvent = {
  id: string; // internal immutable Continuum ID

  source: {
    platform:
      | "chatgpt"
      | "claude"
      | "gemini"
      | "google_takeout"
      | "markdown"
      | "email"
      | "voice"
      | "unknown";
    importBatchId: string;
    externalConversationId?: string;
    externalMessageId?: string;
    externalParentId?: string;
    externalThreadId?: string;
    sourceFilePath?: string;
  };

  identity: {
    externalStableKey?: string;
    contentFingerprint: string;
    structuralFingerprint?: string;
    dedupeKey: string;
  };

  time: {
    createdAt?: string;
    updatedAt?: string;
    importedAt: string;
    sourceTimezone?: string;
    confidence: "exact" | "inferred" | "unknown";
  };

  actor: {
    role: "user" | "assistant" | "system" | "tool" | "other";
    name?: string;
    model?: string;
  };

  content: {
    kind: "text" | "markdown" | "html" | "json" | "audio_transcript" | "attachment_ref";
    text?: string;
    raw?: unknown;
    language?: string;
    tokenEstimate?: number;
  };

  graph: {
    parentEventId?: string;
    childEventIds?: string[];
    conversationEventId?: string;
    branchIndex?: number;
    path?: string[];
  };

  privacy: {
    localOnly: boolean;
    excludedFromSync: boolean;
    sensitivity?: "unknown" | "low" | "medium" | "high";
    detectedKinds?: string[];
  };

  processing: {
    parserVersion: string;
    normalizerVersion: string;
    status: "raw" | "normalized" | "approved" | "synced" | "excluded" | "error";
    warnings?: string[];
  };
};
```

---

## Import identity and idempotency

Use three layers of identity.

### 1. External identity

```text
platform + externalConversationId + externalMessageId
```

Good when available.

Examples:

```text
chatgpt:conversation_id:message_id
claude:conversation_uuid:message_uuid
google_takeout:activity_id
```

Never trust external IDs completely. Treat them as operationally useful, not eternal truth.

### 2. Content fingerprint

Compute:

```text
sha256(
  platform +
  role +
  normalized_text +
  timestamp_bucket +
  conversation_title
)
```

Use this when external IDs are missing or unstable.

Normalization:

```text
trim whitespace
collapse repeated spaces
normalize line endings
strip export-only wrappers
canonicalize markdown
lowercase role names
preserve actual user text casing
```

### 3. Internal Continuum ID

Generate:

```text
continuum_event_id = ulid()
```

The internal ID never changes.

External IDs map to internal IDs via:

```ts
type ExternalSourceReference = {
  id: string;
  continuumEventId: string;
  platform: string;
  externalStableKey?: string;
  contentFingerprint: string;
  importBatchId: string;
  firstSeenAt: string;
  lastSeenAt: string;
};
```

---

## Idempotent re-import behaviour

When a user imports the same file again:

```text
Recognise existing import batch or existing records.
Skip already-imported events.
Report clearly:
  1,284 already known
  42 new
  3 changed
  7 uncertain duplicates
```

When a user imports a newer export:

```text
Existing event with same external key -> update source reference only
Same fingerprint but no external key -> link as duplicate candidate
New external key + new fingerprint -> create new event
Same external key + changed content -> create revision
```

Do not silently overwrite. Use revisions.

```ts
type EventRevision = {
  eventId: string;
  revisionId: string;
  reason: "source_changed" | "parser_changed" | "manual_edit" | "dedupe_merge";
  previousFingerprint: string;
  newFingerprint: string;
  createdAt: string;
};
```

---

## Import batch model

```ts
type ImportBatch = {
  id: string;
  sourcePlatform: string;
  sourceName: string;
  originalFilename: string;
  originalFileHash: string;

  status:
    | "uploaded"
    | "parsed"
    | "normalized"
    | "previewed"
    | "approved"
    | "synced"
    | "cancelled"
    | "failed";

  stats: {
    filesSeen: number;
    conversationsSeen: number;
    messagesSeen: number;
    eventsCreated: number;
    eventsSkippedDuplicate: number;
    eventsUpdated: number;
    errors: number;
    warnings: number;
  };

  createdAt: string;
  completedAt?: string;
};
```

Batch hash:

```text
sha256(original zip/file bytes)
```

Record hash:

```text
sha256(canonical source record)
```

This allows the tool to report:

> You already imported this exact export. Nothing new found.

---

## CLI proposal

### Inspect only

```bash
continuum-import inspect ./chatgpt-export.zip
```

Example output:

```text
Detected: ChatGPT export
Files: conversations.json, chat.html, user.json
Conversations: 842
Messages: 19,402
Branches detected: 321
Estimated importable events: 19,081
```

### Dry run

```bash
continuum-import dry-run ./chatgpt-export.zip --store ./local.continuum
```

Example output:

```text
New events: 19,081
Duplicates: 0
Warnings: 42
Sensitive candidates: 211
Preview written to ./local.continuum/imports/batch_01
```

### Re-import

```bash
continuum-import dry-run ./chatgpt-export-2.zip --store ./local.continuum
```

Example output:

```text
Already known: 19,081
New events: 2,104
Changed records: 12
Uncertain duplicates: 8
```

### Approve

```bash
continuum-import approve batch_01 --exclude-sensitive --exclude "health" --exclude "finance"
```

### Sync

```bash
continuum-import sync batch_01 --target continuum-cloud
```

Rule:

> Sync only approved canonical events, not raw export files, unless explicitly requested.

---

## Local-first architecture

```text
External export ZIP
  ↓
Source adapter
  ↓
Raw import store
  ↓
Normalizer
  ↓
Canonical event store
  ↓
Dedupe engine
  ↓
Preview/index builder
  ↓
User approval
  ↓
Sync package
```

Default behaviour:

```text
raw export stays local
derived previews stay local
server receives only approved events
```

This is a major trust feature.

---

## Adapter interface

```ts
interface ImportAdapter {
  platform: string;
  version: string;

  canHandle(input: ImportInput): Promise<DetectionResult>;

  inspect(input: ImportInput): Promise<ImportInspection>;

  parse(input: ImportInput): AsyncIterable<SourceRecord>;

  normalize(record: SourceRecord): Promise<ContinuumEventDraft>;

  getExternalStableKey(record: SourceRecord): string | undefined;

  getContentFingerprint(record: SourceRecord): string;
}
```

---

## Source record

```ts
type SourceRecord = {
  platform: string;
  recordType: "conversation" | "message" | "attachment" | "metadata";
  sourcePath: string;
  externalId?: string;
  externalParentId?: string;
  raw: unknown;
  parserWarnings?: string[];
};
```

---

## Dedupe decisions

```ts
type DedupeDecision =
  | { action: "create"; reason: "new_external_key" }
  | { action: "skip"; reason: "same_external_key_same_fingerprint"; existingEventId: string }
  | { action: "link_duplicate"; reason: "same_content_fingerprint"; existingEventId: string }
  | { action: "create_revision"; reason: "same_external_key_changed_content"; existingEventId: string }
  | { action: "needs_review"; reason: "fuzzy_match" };
```

---

## Development tooling decision

Use TypeScript as the primary implementation language for the import tool. Rust and WebAssembly are explicitly deferred as premature performance optimization unless benchmarks prove a specific hot path needs it.

The schema/storage layer should stay boring: once a canonical event shape is defined, persistence is primarily an append-only event log plus source-reference and import-batch metadata.

Use two levels of schema tooling:

```text
quicktype
  Development aid for reverse-engineering unknown or changing source export formats.

Zod
  Production validation/parsing boundary inside the import tool.
```

### quicktype role

Use quicktype during adapter development to quickly inspect real-world sample exports and generate provisional TypeScript definitions.

Expected use:

```bash
quicktype conversations.json -o generated/chatgpt-export.types.ts
```

Rules:

- Generated quicktype output is exploratory scaffolding.
- Do not treat quicktype-generated types as the canonical Continuum model.
- Regenerate when sample exports change.
- Keep generated source-schema types close to the adapter that uses them.
- Prefer committing small representative fixtures over committing huge personal exports.

### Zod role

Use Zod at import boundaries for runtime validation, coercion, safe parsing, and graceful degradation.

Expected pattern:

```ts
const parsed = ChatGptExportSchema.safeParse(raw);

if (!parsed.success) {
  // quarantine malformed records, do not crash whole import
}
```

Rules:

- Use `safeParse`, not blind trust.
- Validate source records before normalization.
- Quarantine bad records instead of failing entire imports.
- Keep source schemas separate from canonical Continuum event schemas.
- Treat vendor export formats as unstable and vendor-controlled.

Architectural distinction:

```text
source export schema
  unstable, external, adapter-local

canonical Continuum event schema
  stable, internal, product-shaped
```

---

## Preview UI requirements

Before sync, show:

```text
Top conversations
Top recurring themes
Timeline density
Potentially sensitive clusters
Duplicate summary
New vs already known
Branches/regenerations
Unresolved active threads
```

User actions:

```text
approve all
exclude conversation
exclude topic cluster
exclude date range
exclude sensitive candidates
merge duplicates
keep local only
delete raw import
sync approved
```

---

## Derived outputs

The import tool should generate optional derived materialized views:

```text
conversation transcript
message graph
topic clusters
timeline
active threads
recurring themes
people/entities/projects
summary per conversation
summary per cluster
```

Derived views are disposable.

Rule:

> Raw canonical events are source of truth. Summaries can be regenerated.

---

## Privacy and safety

MVP should detect and flag:

```text
passwords/API keys
email addresses
phone numbers
addresses
medical terms
financial terms
legal terms
relationship/family terms
work/client names
```

Do not block import by default. Use these detections to help preview and review.

Privacy statuses:

```text
local_only
approved_for_sync
excluded
needs_review
```

Strong product promise:

> Nothing leaves your device until you approve it.

---

## Error handling

Bad records should not kill the import.

```text
Parse 99.7%
Quarantine 0.3%
Show warnings
Allow export of error report
```

Quarantine model:

```ts
type ImportErrorRecord = {
  importBatchId: string;
  sourcePath: string;
  rawSnippet?: string;
  errorCode: string;
  message: string;
  recoverable: boolean;
};
```

---

## MVP implementation slice

Proposed package layout:

```text
packages/continuum-import
  src/
    adapters/
      chatgpt.ts
      claude.ts
      googleTakeout.ts
      markdown.ts
    core/
      detect.ts
      parse.ts
      normalize.ts
      fingerprint.ts
      dedupe.ts
      batch.ts
      preview.ts
    generated/
      chatgpt-export.types.ts
      claude-export.types.ts
      google-takeout.types.ts
    cli.ts
```

MVP commands:

```bash
continuum-import inspect <file>
continuum-import dry-run <file>
continuum-import approve <batch>
continuum-import sync <batch>
```

MVP sources:

```text
ChatGPT conversations.json
Claude JSON export
Google Takeout activity export
Markdown folder
```

MVP storage:

```text
local SQLite
raw files stored by hash
canonical events table
external source references table
import batches table
```

---

## Acceptance criteria

The tool is good enough when:

```text
same ChatGPT export imported twice creates zero duplicate events
newer ChatGPT export imports only new messages
Claude export normalizes into the same ContinuumEvent shape
Google Takeout records import even with partial metadata
Markdown folder import works as a generic escape hatch
quicktype can generate exploratory source types from fixtures
Zod validates source records before canonical event normalization
malformed source records are quarantined rather than fatal
user can preview before sync
raw export remains local by default
event provenance is preserved
bad records are quarantined, not fatal
dedupe report is understandable
```

---

## Design principle

Do not build "an importer."

Build:

> A reversible digestion pipeline for external cognition.

The user is not moving files. They are letting Continuum gently metabolise their existing thinking history.
