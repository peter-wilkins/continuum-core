# Apache Arrow and Continuum Memory Strata

This note captures the architectural conclusions from the Apache Arrow discussion.

## Short version

Apache Arrow should not be treated as the Continuum database.

It is better understood as a fast in-memory and interchange substrate for analytical working sets, model pipelines, and derived views.

Continuum still needs a durable source of truth: an append-only event log, object/blob storage, and probably a simple database layer for metadata, sync, and operational state.

Arrow becomes useful when we want many interpreters to read the same structured data efficiently without constantly converting between JSON, ORM objects, protobufs, data frames, and model-specific structures.

## Apache Arrow philosophy

Arrow is primarily a standard memory layout for structured data.

Its philosophy is:

- columnar data
- efficient batches
- zero-copy interoperability
- avoid repeated serialization/deserialization
- let multiple systems read the same bytes directly
- work well with analytical and vectorized workloads

It is not:

- a database
- an event log
- a sync engine
- a graph database
- a vector database
- a workflow engine
- a general mutable object model

## Fit with Continuum

Continuum is naturally event-oriented:

- voice note captured
- transcript produced
- embedding generated
- summary derived
- location/context attached
- memory cluster updated
- narrative view materialized

The raw shape is an append-only cognition log.

Arrow fits best after capture, when we build working sets and derived views:

```text
raw events
  -> normalized records
  -> Arrow batches
  -> model pipelines
  -> materialized cognitive views
```

## Immutable memory strata

A strong pattern for Continuum is immutable segmented storage.

Think:

```text
2026-01.arrow
2026-02.arrow
2026-03.arrow
```

or, more generally:

```text
memory stratum: month / project phase / life chapter / context window
```

The past is mostly fixed. We do not constantly rewrite old memory.

This lets us ask human-shaped questions:

- What was this continuum like in March?
- How did the coding thread change over spring?
- What did morning-capture mode look like last month?
- Did the person change, or did the interpreter change?

This is less like precise banking-style bi-temporal querying and more like fuzzy cognitive archaeology.

## Occurrence Time and Knowledge Time

Continuum probably needs two simple time axes:

- **Occurrence Time**: when the thing happened or was true in the world
- **Knowledge Time**: when Continuum learned about it, imported it, generated it, or corrected it

This handles:

- imported old chats
- delayed transcription
- late-arriving sensor data
- reprocessed summaries
- model upgrades
- corrected metadata

This does not need full heavyweight bi-temporal database semantics at first.

## Base layers plus overlays

Arrow does not prioritise tiny writes or frequent mutation.

The relevant pattern is close to:

- Log-Structured Merge Trees
- delta layers
- copy-on-write
- multi-version concurrency control
- compaction

For Continuum:

```text
base stratum
+ small overlay of corrections / late imports / reinterpretations
= queryable current view
```

Example:

```text
2026-03.arrow
+ 2026-03.overlay.log
+ model-v4-reinterpretations.parquet
-> March current view
```

Queries read the big mostly-immutable base, then apply newer overlays.

Later, background compaction can fold overlays into a new clean stratum:

```text
old base + overlays -> new base
```

This gives us stable history without pretending memory never changes.

## Versioned interpretations

The durable event should be separated from its interpretations.

Example:

```text
event: voice note captured on 2026-03-08
interpretation v1: transcript from ASR model A
interpretation v2: transcript from ASR model B
interpretation v3: summary from LLM C
embedding v1: model X
embedding v2: model Y
```

This allows questions like:

- Did the memory change?
- Did the summary change?
- Did the embedding model change?
- Did a new interpreter find a different pattern?

This separation is central to Continuum.

## Likely architecture

A plausible stack:

```text
append-only event log
  -> durable source of truth

object/blob storage
  -> audio, images, screenshots, large raw artifacts

metadata store
  -> ids, timestamps, permissions, source links, import state

Arrow batches / Parquet strata
  -> analytical and model-ready working sets

overlay logs / delta layers
  -> late data, corrections, reinterpretations

materialized views
  -> timelines, clusters, summaries, narrative threads, cognitive maps

query/interpreter layer
  -> DataFusion, Polars, custom pipelines, LLM passes
```

## Arrow plus Parquet

Useful distinction:

- Arrow: in-memory format
- Parquet: durable columnar file format

Potential Continuum use:

```text
live working set: Arrow
historical strata: Parquet or Arrow IPC
```

Do not force the whole MVP into Arrow. Use it where it clearly removes conversion overhead or enables fast batch processing.

## DataFusion and Polars

Two particularly relevant ecosystem tools:

- DataFusion: Rust-native query engine built around Arrow
- Polars: fast dataframe library with strong Arrow alignment

DataFusion feels especially relevant for Continuum Core because it could support embedded, local-first analytical queries over Arrow/Parquet-backed memory strata.

Polars may be useful for experimentation, notebooks, analysis tools, and rapid model exploration.

## Cognitive fit

This architecture maps surprisingly well onto human memory:

- raw traces are captured
- older traces settle into strata
- later interpretations overlay them
- summaries are regenerated
- emotional weighting can shift
- memory can be viewed by season, context, project, or mode

This is better than modelling the mind as a mutable object graph.

A good phrase for the pattern:

> frozen memory strata plus active reinterpretation

## Warnings

Do not overbuild this too early.

For MVP, prefer:

- simple event log
- durable blobs
- stable ids
- idempotent import
- transcripts
- embeddings
- summaries
- simple materialized views

Arrow becomes more important when Continuum needs:

- large local working sets
- multimodal model pipelines
- fast clustering
- repeated batch interpretation
- zero-copy movement between tools
- month/project/context comparisons
- local-first analytical memory

## Current conclusion

Arrow is not the database of Continuum.

Arrow is a strong candidate for the internal memory substrate used by interpreters, analytical pipelines, and materialized cognitive views.

The strongest architectural shape is:

```text
event log as truth
+ immutable time/context strata
+ small mutable overlays
+ periodic compaction
+ versioned interpretations
+ materialized cognitive views
```

That aligns well with Continuum's philosophy: capture first, preserve history, reinterpret later, and let many models build different views over the same underlying life stream.
