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

**Source Log**:
The append-only record of **Entries** that acts as the source of truth for captured context. Derived material must not be treated as source truth.
_Avoid_: memory, archive, database

**Memory Layer**:
Derived retrieval material built from the **Source Log**, such as summaries, embeddings, salience, temporal weighting, and Continuation associations. The **Memory Layer** must be rebuildable from the Source Log except where Entries have been forgotten.
_Avoid_: source memory, transcript store

**Forget Request**:
A user instruction to remove captured context from both the **Source Log** and the **Memory Layer**. A Forget Request may target time, recent context, a Continuation, or a topic.
_Avoid_: hide, archive, dismiss

**Forgotten Entry**:
An **Entry** that is no longer available for retrieval, resumption, or derived memory. The system may retain a minimal non-content tombstone only to prevent deleted content from being restored accidentally.
_Avoid_: archived entry, hidden entry, redacted entry

**Continuation**:
An ongoing and potentially unbounded context the system can resume, such as a thought, job, customer situation, topic, or piece of work. A **Continuation** may be inferred before the user explicitly resumes it, and its identity may later be renamed, merged, or split.
_Avoid_: stream, folder, project, thread

**Continuation Link**:
A relationship between an **Entry** and a **Continuation**, including why the Entry appears relevant and how confident that relationship is. One **Entry** may have many **Continuation Links**.
_Avoid_: membership, filing, tag

**Resume Brief**:
A materialized view of a **Continuation** for a specific moment of resumption. It contains concise restart context, relevant Entries with reasons, open threads, Confidence, and generation time; it is not the Continuation itself.
_Avoid_: resume pack, continuation state, snapshot

**Resume Request**:
A user's request to continue an ongoing context, usually expressed in natural language such as `Resume boiler quote` or `Re kitchen redesign`. A Resume Request produces a **Resume Brief**.
_Avoid_: search query, command invocation, open request

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
