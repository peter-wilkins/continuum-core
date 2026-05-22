# 062: Model Chairman Session Events

Status: ready

## Type

AFK.

## What To Build

Add the first core model for a **Chairman Session**: a continuable facilitation state for one bounded meeting, grill, design thread, or solo thinking session.

The Chairman keeps the decision tree alive:

- what the meeting is for
- which Line of Inquiry is active
- which Lines are parked
- what has been decided
- what can be resumed later

This slice should model Chairman source truth as append-only events and rebuild the current Chairman state as a projection.

## First Failing Test

`rebuilds a Chairman Session agenda from append-only events`

## Acceptance Criteria

- [ ] Define a `ChairmanSession` concept scoped to one meeting/conversation/thread, not one global Chairman.
- [ ] A Chairman Session can exist before it is linked to a larger Continuation.
- [ ] A session starts with an Agenda that has exactly one Root Line.
- [ ] The meeting title is derived from the Root Line title, not duplicated as separate mutable state.
- [ ] A Line of Inquiry has a title, question, desired outcome, outcome status, lifecycle status, parent Line reference, and source event references.
- [ ] Line lifecycle status supports `active`, `parked`, `resolved`, and `abandoned`.
- [ ] Outcome status supports `unknown`, `defined`, `achieved`, and `abandoned`.
- [ ] A resolved or abandoned Line must have at least one Chairman Decision.
- [ ] Chairman Decisions support at least `agreement`, `chair_call`, `solo_decision`, `assumption`, `parked_for_later`, and `abandoned`.
- [ ] Chairman state is rebuilt from append-only Chairman Events.
- [ ] Chairman Events may contain small labels/summaries, but must link back to source event ids when they summarize conversation.
- [ ] Do not add a separate Question object in this slice; a Line carries the question.

## Blocked By

None - can start immediately.

## Out Of Scope

- Voting systems.
- Quorum rules.
- Approval authority.
- Multi-user governance.
- Meeting UI.
- Calendar integration.
- LLM facilitation.

## Notes

Working definition:

> A Chairman Session is a Lens over a conversation or meeting that tracks Lines of Inquiry, decisions, parked topics, and the current path to an outcome.

Chairman is facilitation and continuity in the MVP, not governance machinery.

Future meeting governance may support:

- voting method
- quorum required
- eligible voters
- vote events
- dissent and approval trails

But MVP rule:

> A Chairman can record that a decision happened. It does not yet prove the decision was legitimate.

Source-truth rule:

```text
ChairmanEvents are source truth.
ChairmanState is a rebuildable projection.
```

Sketch of the intended event vocabulary:

```ts
type ChairmanEventKind =
  | "session_started"
  | "line_added"
  | "line_status_changed"
  | "line_outcome_defined"
  | "decision_recorded"
  | "line_returned_to"
  | "session_paused"
  | "session_resolved";
```
