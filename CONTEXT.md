# Continuum Core

Continuum Core names the domain of preserving and resuming human context without making the user maintain notes, folders, or search queries.

## Language

**Entry**:
An immutable captured unit from something the user said, typed, or did. Entry content is not edited in place, but an Entry may be erased through a **Forget Request**.
_Avoid_: note, memory, transcript chunk

**Capture Context**:
The required situation envelope attached to an **Entry** when it is captured. Capture Context includes the capture time and structured **Context Clues** supplied by the Host App; missing knowledge should be represented explicitly rather than omitted.
_Avoid_: metadata, optional fields, source

**Context Clue**:
An individual piece of evidence that helps interpret or connect an **Entry**, such as location, calendar, device, app route, active job, or recent user activity. A Context Clue has a kind, human-readable text, confidence, and observation time.
_Avoid_: tag, category, note

**Confidence**:
A bounded 0..1 strength value used when the system is uncertain, such as Context Clue reliability, Continuation Links, and retrieval ranking. Confidence is not a user-facing truth claim.
_Avoid_: certainty, score without bounds, priority

**Retrieval Confidence**:
A **Confidence** value describing the strength of evidence for a **Continuation Candidate**. Retrieval Confidence may combine semantic similarity, recency, recurrence, explicit cues, and **Link Reasons**; it is not a probability that the system is correct.
_Avoid_: truth probability, raw similarity score, certainty

**Source Log**:
The append-only record of **Entries** that acts as the source of truth for captured context. Derived material must not be treated as source truth.
_Avoid_: memory, archive, database

**Canonical Event**:
An immutable normalized event in Continuum's unified event model. A Canonical Event may come from live capture or from an imported external source record.
_Avoid_: vendor record, raw message, source-specific event

**Imported Entry**:
An **Entry** created from a **Canonical Event** during import. Retrieval and **Continuation** inference work over Entries in the **Source Log**, not over source-specific Canonical Events directly.
_Avoid_: imported event, vendor memory, raw import record

**Source Graph Reference**:
A source-system relationship identifier preserved during import, such as a ChatGPT parent message id. A Source Graph Reference is not the same thing as a canonical parent event id until both source records have been normalized and linked.
_Avoid_: canonical parent, internal graph edge

**Memory Layer**:
Derived retrieval material built from the **Source Log**, such as summaries, embeddings, salience, temporal weighting, and Continuation associations. The **Memory Layer** must be rebuildable from the Source Log except where Entries have been forgotten.
_Avoid_: source memory, transcript store

**Local Source Cache**:
A disposable, rebuildable local read model built from Canonical Event JSONL and import batches so a Host App can inspect and serve imported context quickly. The Local Source Cache is not the Source Log, not the Memory Layer, and not the future analytical memory substrate.
_Avoid_: local database as truth, permanent memory store, hidden source of record

**Forget Request**:
A user instruction to remove captured context from both the **Source Log** and the **Memory Layer**. A Forget Request may target time, recent context, a Continuation, or a topic.
_Avoid_: hide, archive, dismiss

**Forgotten Entry**:
An **Entry** that is no longer available for retrieval, resumption, or derived memory. The system may retain a minimal non-content tombstone only to prevent deleted content from being restored accidentally.
_Avoid_: archived entry, hidden entry, redacted entry

**Continuation**:
An ongoing and potentially unbounded context the system can resume, such as a thought, job, customer situation, topic, or piece of work. A **Continuation** may be inferred before the user explicitly resumes it, and its identity may later be renamed, merged, or split.
_Avoid_: stream, folder, project, thread

**Continuation Surface**:
A user-facing projection over **Continuations**, **Entries**, and **Resume Briefs**. A Continuation Surface may look like a chat list, timeline, graph, recent activity list, or explicit "new subject" affordance, but it is not the source of truth.
_Avoid_: conversation as source truth, folder UI, canonical chat

**Continuity Map**:
A projection that shows how thought moved across **Entries**, **Continuations**, **Continuation Links**, topic turns, returns, branches, and dead ends. A Continuity Map can support debugging, user resumption, organisational reflection, or other future surfaces; it is not the source of truth.
_Avoid_: chat transcript view, canonical graph, meeting score as source truth

**Subject Boundary Cue**:
A user or interface signal that the current subject may be changing, such as starting a new chat or saying "new subject". A Subject Boundary Cue may influence **Continuation Link** Confidence, but it does not create a hard boundary and can be overridden by stronger Entry evidence.
_Avoid_: hard thread split, conversation boundary, forced new Continuation

**Continuation Link**:
A relationship between an **Entry** and a **Continuation**, including why the Entry appears relevant and how confident that relationship is. One **Entry** may have many **Continuation Links**. This is internal/explanatory domain language; user surfaces should phrase it as "this seems connected to..." or show it through a **Continuity Map**.
_Avoid_: membership, filing, tag

**Resume Brief**:
A materialized view of a **Continuation** for a specific moment of resumption. It contains concise restart context, relevant Entries with reasons, open threads, Confidence, and generation time; it is not the Continuation itself.
_Avoid_: resume pack, continuation state, snapshot

**Resume Request**:
A user's request to continue an ongoing context, usually expressed in natural language such as `Resume boiler quote` or `Re kitchen redesign`. A Resume Request produces a **Resume Brief**.
_Avoid_: search query, command invocation, open request

**Continuity Retrieval**:
The process of finding likely **Continuations** for a **Resume Request** or current **Working Context**, using **Entries** as evidence. Continuity Retrieval returns candidate Continuations with reasons and Confidence; a **Resume Brief** is assembled after a Continuation is selected or ranked high enough.
_Avoid_: keyword search, event lookup, direct brief retrieval

**Continuation Candidate**:
A possible **Continuation** returned by **Continuity Retrieval**, with supporting **Entries**, reasons, and Confidence. The first retrieval result is a ranked set of Continuation Candidates, not a forced single answer.
_Avoid_: search result, guessed thread, ungrounded match

**Link Reason**:
A human-readable explanation for why an **Entry** supports a **Continuation Link** or **Continuation Candidate**. Link Reasons make retrieval inspectable for users, debugging, and later **Continuity Maps**.
_Avoid_: opaque score, hidden embedding match, magic relevance

**Signal Evidence**:
Any evidence used to create, update, strengthen, weaken, split, or reject a **Continuation Link**. Signal Evidence can include semantic inference, recurrence, time, explicit **Resume Requests**, **Subject Boundary Cues**, user corrections, or future signals not yet imagined.
_Avoid_: closed signal list, embedding-only evidence, user-action-only evidence

**Ranking Signal**:
A kind of **Signal Evidence** used by **Continuity Retrieval** to rank **Continuation Candidates**. Ranking Signals may include semantic similarity, recency, recurrence, explicit cues, **Context Clues**, and **Feedback Signals**.
_Avoid_: context clue for all retrieval evidence, raw feature, hidden ranking input

**Ranking Profile**:
A named weighting configuration for **Ranking Signals**. Ranking Profiles are debugging, QA, and user-testing tools first; they compare how different evidence mixes affect **Continuation Candidate** ranking without exposing tuning controls to normal users.
_Avoid_: hard-coded scoring, single global weighting, invisible ranking mode

**Deterministic Retrieval Baseline**:
A first **Continuity Retrieval** implementation using inspectable **Ranking Signals** such as text overlap, recency, recurrence, explicit cues, and **Link Reasons**, before embeddings or model scoring are introduced.
_Avoid_: embedding-only MVP, opaque first slice, model-dependent baseline

**Retrieval Tracer Bullet**:
The first vertical slice of **Continuity Retrieval**: given imported **Entries**, a **Resume Request** returns ranked **Continuation Candidates** with **Link Reasons**. The goal is to prove the pipeline and inspection shape, not to make the first rankings good.
_Avoid_: polished retrieval, quality-gated first slice, Resume Brief first

**Signal Evidence Trail**:
The retained evidence behind a **Continuation Link** or **Continuation Candidate**. A Signal Evidence Trail supports debugging, rebuilding, user correction, membranes, and **Continuity Maps**.
_Avoid_: final score only, throwaway explanation, hidden ranking state

**Retrieval Feedback Loop**:
A loop that compares **Continuity Retrieval** results with later evidence, user behaviour, explicit corrections, and debugging observations to improve ranking and **Link Reasons**. A Retrieval Feedback Loop teaches the system from outcomes without treating feedback as unquestionable truth.
_Avoid_: self-training black box, static scoring, uninspected optimisation

**Feedback Signal**:
Evidence fed into a **Retrieval Feedback Loop**. Feedback Signals may include explicit user corrections, user behaviour, debugging observations, later successful resumes, failed resumes, and model-assisted critique. Model-assisted critique is evidence to inspect, not an authority.
_Avoid_: hidden training label, LLM judge as truth, behaviour-only metric

**Ambiguous Resume**:
A **Resume Request** where multiple **Continuations** are plausible and the system should surface low Confidence with candidates rather than pretend certainty. An Ambiguous Resume is a valid result, not a failure.
_Avoid_: failed search, guessed match, forced match

**Ambiguous Resume Surface**:
A **Continuation Surface** for an **Ambiguous Resume** that leads with the strongest **Continuation Candidate** while showing alternates. Debugging surfaces may expose many candidates so the ranking and **Candidate Spread** can be inspected.
_Avoid_: blocking chooser, single forced answer, hidden alternates

**Candidate Spread**:
The distance between ranked **Continuation Candidates** in **Retrieval Confidence** and supporting evidence. A narrow Candidate Spread should produce an **Ambiguous Resume** instead of forcing a single Continuation.
For MVP/debug app experiments, use `0.1` as the starting narrow-spread threshold. Treat this as calibration evidence, not product truth.
_Avoid_: winner by default, hidden uncertainty, arbitrary tie break

**Open Thread**:
An unresolved question, task, tension, or next step that remains active within a **Continuation**. Open Threads help a Resume Brief restart action rather than merely summarize history.
_Avoid_: todo, task only, reminder

**Working Context**:
The live context an app or agent uses while the user continues. It may include a **Resume Brief**, new **Entries**, current app state, and recent user intent.
_Avoid_: session, window, prompt context

**Host App**:
A TypeScript application that embeds Continuum Core. The Host App owns users, auth, UI, capture devices, persistence infrastructure, model credentials, and runtime configuration.
_Avoid_: client, consumer, frontend

## Flagged Ambiguities

- **Stream** is avoided because it is overloaded in software. Use **Continuation** for an ongoing resumable context.
- **Metadata** is avoided because it hides whether context is required. Use **Capture Context** for the required envelope and **Context Clue** for individual evidence.
- **Continuation state** is avoided because it blurs the infinite Continuation with the materialized view. Use **Resume Brief** for the materialized view.
- **Source parent id** is avoided for canonical relationships because external graph ids and internal event ids have different stability and meaning. Use **Source Graph Reference** until the canonical relationship is known.

## Example Dialogue

Developer: "When Peter says something while driving, is that a Continuation?"

Domain expert: "No. That captured thing is an Entry. The Continuation is the ongoing thing it belongs to, like the boiler quote or advert ideas."

Developer: "Can one Entry belong to more than one Continuation?"

Domain expert: "Yes. A single Entry might mention a customer, a job, and a pricing idea. Each relationship is a Continuation Link."

Developer: "When Peter says `Resume Bob boiler quote`, does the system return the Continuation?"

Domain expert: "No. The Continuation is potentially infinite. The system returns a Resume Brief, then uses that inside the Working Context."

Developer: "If Peter says `Forget last 10 minutes`, can we delete only the summary?"

Domain expert: "No. Forgetting must remove the relevant Entries from the Source Log and remove or rebuild derived Memory Layer material."

Developer: "Can a forgotten Entry still appear in a Resume Brief?"

Domain expert: "No. A Forgotten Entry is unavailable for retrieval or resumption."
