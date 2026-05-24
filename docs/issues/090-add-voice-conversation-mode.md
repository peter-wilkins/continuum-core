# 090 - Add Voice Conversation Mode

## Status

Open

## Context

Continuum should support a ChatGPT-mobile-app-style mode where the user can simply talk to a model and hear or read a reply.

This is not a generic chatbot as source truth. It is a voice-first **Continuation Surface** over the existing domain model:

```text
spoken user turn
-> Raw Transcript Text
-> secret/privacy membranes
-> Concierge does bounded legwork
-> Chairman Session keeps the Line coherent
-> answer, next question, or parked Line
```

The important product feeling is low friction: open the app, talk, get a useful response, keep thinking. The important Continuum difference is that the conversation remains continuable, source-backed, and safe when humans make mistakes.

## Product Decision

Voice Conversation Mode is allowed to feel like "just talking to a model", but internally it must remain grounded in Continuum concepts:

- user speech becomes capture material, not polished source truth
- model replies are projections, not immutable memory
- each turn can attach to a Continuation, Line, or Thought Journey
- the Chairman can interrupt gently when the conversation is drifting
- secret-spill and privacy membranes run before material becomes memory-active
- `Why this?` / `Sources` can be surfaced when the reply depends on retrieved material

## First Vertical Slice

Add a phone-friendly voice conversation surface that:

- accepts spoken input
- transcribes into editable text before send
- sends one user turn into the existing public MVP query path
- displays one synthesized answer and one suggested next question
- stores enough ids to resume the Line later

## Acceptance Criteria

- [ ] User can speak a turn without typing.
- [ ] Dictation appears in an editable text box before send.
- [ ] Send creates a query/turn event that can be linked to a Continuation or Line.
- [ ] The response includes a synthesized answer, not just document cards.
- [ ] The response includes one next question or Line of Inquiry.
- [ ] Secret-spill membrane runs over the transcript before persistence/display.
- [ ] The mode does not make the chat transcript source truth.
- [ ] The UI can feel like chat, but domain docs continue to call it a Continuation Surface or Voice Conversation Mode.

## Notes

- This is a strong mobile MVP candidate.
- Keep Lens Compare for builder/debug surfaces; normal users can start with answer-first voice.
- Later work can add streaming model replies, spoken output, interruption, and offline audio capture.
