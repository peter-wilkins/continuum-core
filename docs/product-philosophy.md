# Product Philosophy

## The best interface disappears into intent

The goal is not literally "no UI".

The goal is:

> No visible maintenance burden.

The user should remain in cognition mode rather than software-operation mode.

## Least Context Switching Principle

When the user can give useful signal, capture it at the point of use.

Do not make the user leave the current thought, surface, or task just to explain what happened.

Prefer:

- one-touch feedback first
- current surface/query/Lens context captured automatically
- optional detail after the signal is safe
- diagnostic Context Clues gathered by the system
- later maintainer/agent triage rather than making the user file a perfect report

This follows JobDone's feedback pattern: the feedback report is a small user signal plus bounded context clues for reproduction, not a support-ticket workflow and not background telemetry.

Continuum should apply the same rule to Lens feedback, Curator feedback, capture correction, and future crash/problem reporting.

## Traditional knowledge management breaks flow

Most systems interrupt thought with:

- naming
- categorising
- tagging
- choosing folders
- deciding structure
- deciding importance

This turns the human into the database administrator for their own mind.

Continuum Core assumes modern language models can infer enough structure to remove much of this burden.

## Interruptions are first-class

The target user may not stay on one topic for long.

This is not a failure mode to punish. It is part of the product shape.

Continuum should let the user:

- honour a sudden important thought
- capture enough to make it resumable
- return to the prior thought without losing the path

The system should treat topic jumps as managed redirects, not as broken sessions.

A visible progress signal helps because each active thought can keep its own coarse state:

- this one is just started
- this one is halfway to a decision
- this one is nearly done

The product should reduce the shame and overhead of switching context, while still helping the user finish things.

## Thought is not hierarchical

Human thought is:

- associative
- temporal
- contextual
- recursive
- overlapping

The concept of a strict project/folder hierarchy is often a historical constraint inherited from older software.

The user may believe they are resuming a thread.
Internally the system may actually be assembling a probabilistic Resume Brief from:

- semantic similarity
- temporal proximity
- unresolved tasks
- people/place/entity links
- emotional salience
- recency
- inferred intent

The user does not need to understand this machinery.

## Resume as protocol

"Resume" is important because it implies:

- continuity
- low startup cost
- no navigation
- existing understanding

Contrast with:

- search
- open
- find
- browse

Those imply manual retrieval.

Resume implies the system already understands the Continuation.

## Always recording + always searching

This pairing is the central conceptual innovation.

### Always recording

The user does not decide when capture starts.

### Always searching

The system continuously assembles and ranks relevant context.

Combined effect:

- reduced cognitive friction
- reduced context switching
- reduced maintenance burden
- reduced retrieval delay
- stronger continuity of thought

## Privacy

The system only works if users trust deletion and boundaries.

Deletion and forgetting must feel tangible and immediate.

Examples:

- Forget last 10 minutes
- Erase this Continuation
- Never remember this topic

Without trust, users will self-censor and the quality of capture collapses.
