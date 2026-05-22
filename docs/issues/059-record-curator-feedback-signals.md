# 059: Record Curator Feedback Signals

Status: ready

## Type

AFK.

## What to build

Add the first reusable Curator feedback model to the core library. The same feedback shape should work for imported history and day-to-day captured thoughts.

The Curator is not only an import cleanup tool. It is the membrane that helps decide what becomes memory-active during normal Continuum use.

This core slice owns meaning, not interaction:

- what a Curator feedback signal is
- what it can target
- which low-friction actions exist
- how feedback remains append-only evidence
- how feedback can be summarized for later curation

Do not add UI, storage adapters, swipe gestures, review feeds, or app-specific persistence here.

## First failing test

`records a Curator feedback signal for a memory candidate`

## Acceptance Criteria

- [ ] Define a Curator feedback signal type that can target an imported event, an Imported Entry, or a live captured thought.
- [ ] Support low-friction actions such as `keep`, `not_useful`, `me`, `not_me`, `important`, `passing_thought`, `private`, and `shareable`.
- [ ] Feedback signals are append-only and do not overwrite raw capture, Canonical Events, or Entries.
- [ ] Feedback can adjust future curation decisions without treating one signal as unquestionable truth.
- [ ] The model can represent signals produced by later idle-time review UX such as swipe left/right or a compass-style review surface.
- [ ] Export pure helpers for recording/summarizing Curator feedback without adding persistence.
- [ ] The implementation does not require a conversational Curator Agent, autonomous learning loop, or app UI.

## Blocked by

None - can start immediately.

## Notes

Resolved domain decision:

- The Curator is reusable across imports and day-to-day capture.
- User feedback is admin work, but it can be a good use of idle time if the interaction is low friction and feels like browsing one's own history.
- The MVP should capture feedback as evidence. Learning and richer UI can come later.
- Split of responsibility:
  - `continuum-core`: what feedback means.
  - `continuum`: how the user gives feedback.

Useful framing:

- Recorder: get it down.
- Curator: earn its place.
- Feedback signal: tiny user judgement that helps the Curator decide what should become memory-active.
