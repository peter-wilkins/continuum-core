# 059: Record Curator Feedback Signals

Status: ready

## Type

AFK.

## What to build

Add the first reusable Curator feedback loop. The same feedback shape should work for imported history and day-to-day captured thoughts.

The Curator is not only an import cleanup tool. It is the membrane that helps decide what becomes memory-active during normal Continuum use. The first slice should record tiny user feedback signals without requiring a full interactive learning system.

## First failing test

`records a Curator feedback signal for a memory candidate`

## Acceptance Criteria

- [ ] Define a Curator feedback signal type that can target an imported event, an Imported Entry, or a live captured thought.
- [ ] Support low-friction actions such as `keep`, `not_useful`, `me`, `not_me`, `important`, `passing_thought`, `private`, and `shareable`.
- [ ] Feedback signals are append-only and do not overwrite raw capture, Canonical Events, or Entries.
- [ ] Feedback can adjust future curation decisions without treating one signal as unquestionable truth.
- [ ] The model can represent idle-time review UX such as swipe left/right or a compass-style review surface.
- [ ] The first implementation does not require a conversational Curator Agent or autonomous learning loop.

## Blocked by

None - can start immediately.

## Notes

Resolved domain decision:

- The Curator is reusable across imports and day-to-day capture.
- User feedback is admin work, but it can be a good use of idle time if the interaction is low friction and feels like browsing one's own history.
- The MVP should capture feedback as evidence. Learning and richer UI can come later.

Useful framing:

- Recorder: get it down.
- Curator: earn its place.
- Feedback signal: tiny user judgement that helps the Curator decide what should become memory-active.
