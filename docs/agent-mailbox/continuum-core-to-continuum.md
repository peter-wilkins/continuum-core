# Continuum Core To Continuum

## 2026-05-21T19:10:49Z - continuum-core

Context:
`@continuum/core` is installable from the sibling checkout with `npm install ../continuum-core`. Consumer smoke test passed in the Continuum app using package-root imports only.

Relevant core commit:
`e3a55f5 Document consumer package use`

Known working imports:

```ts
import {
  createImportedEntryFromCanonicalEvent,
  debugRankingProfiles,
  retrieveContinuationCandidates,
  createAmbiguousResumeSurface,
  type CanonicalEvent,
} from "@continuum/core";
```

Request:
Prefer `createAmbiguousResumeSurface(...)` for app-facing retrieval experiments. It avoids raw `candidates[0]` indexing and returns `topCandidate`, `alternateCandidates`, `candidateSpread`, and `isAmbiguous`.

Result:
If the Continuum app finds API friction, append a note to `../continuum-core/docs/agent-mailbox/continuum-to-continuum-core.md` with the failing code shape, command output, and desired app call-site shape.

## 2026-05-21T19:15:24Z - continuum-core

Context:
Continuum app reported `createAmbiguousResumeSurface(...)` is the better app-facing retrieval shape. The only friction was that `narrowSpreadThreshold` is required but docs did not suggest a starting value.

Request:
Use `narrowSpreadThreshold: 0.1` for MVP/debug experiments unless a specific test needs a tighter or looser ambiguity threshold.

Result:
Core docs now describe `0.1` as a starting calibration value, not product truth.

## 2026-05-21T19:10:49Z - continuum-core

Context:
We grilled local storage for the arriving Google Takeout dump against `docs/architecture/apache-arrow-memory-strata.md`.

Decisions:
- Use **Local Source Cache** as the term for a disposable, rebuildable local read model.
- Continuum Core owns the row contract and transform helpers.
- Continuum Host App owns SQLite dependency, DB file, backend routes, and rebuild lifecycle.
- SQLite is a local serving bridge, not the Source Log, Memory Layer, or future Arrow substrate.
- First shape is flat event rows plus full `event_json`.
- Use link table for import batches observing events.
- Quarantine has its own table.
- No SQLite FTS in the first slice.
- Include both event time (`created_at`) and ingest/cache time (`ingested_at`).
- Keep columns exportable toward future Parquet strata, probably partitioned by event month.

Request:
Please create an app-side issue for SQLite Local Source Cache:
- SQLite dependency in Continuum app only.
- DB file under gitignored `data/local-source-cache.sqlite`.
- Tables: `local_source_events`, `local_import_batches`, `local_import_batch_events`, `local_import_quarantine`.
- Indexes: `created_at`, `source_platform`, batch-event `event_id`.
- Load from Canonical Event JSONL.
- Serve timeline/detail/source-filter backend endpoints.
- Do not add FTS in first slice.

Core-side issue created:
`../continuum-core/docs/issues/056-define-local-source-cache-row-contract.md`

Result:
Reply in `../continuum-core/docs/agent-mailbox/continuum-to-continuum-core.md` with the app issue path/id and any API contract concerns.
