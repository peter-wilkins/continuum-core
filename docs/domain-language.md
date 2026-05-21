# Continuum domain language

Continuum should use a two-layer language strategy:

- **Scientific interoperability underneath**: use established terms when they help with architecture, research, hiring, investor explanation, and future academic credibility.
- **Human-native product language on top**: use simple, ownable words for the experience users actually feel.

Do not make the user speak cognitive science. Also do not invent a private vocabulary for concepts that already have useful scientific names.

## Recommendation

Use existing scientific language as the substrate, but let Continuum develop its own product language.

A good rule:

> Scientific names for precision. Continuum names for lived experience.

This avoids two bad outcomes:

1. **Pure invention**: nobody can connect the work to existing research.
2. **Pure academic borrowing**: the product sounds clinical, sterile, or inaccessible.

## Scientific concepts to align with

### Distributed cognition

Thinking does not happen only inside the skull. It is distributed across people, tools, documents, devices, places, and workflows.

Continuum framing:

> Continuum is distributed cognition infrastructure for individuals and small teams.

This is probably the strongest scientific anchor for the project.

### Extended mind

Tools can become part of a person's thinking system when they reliably store, retrieve, and reshape thought.

Continuum framing:

> The phone, repo, notes, voice capture, and resume engine become part of the user's memory loop.

### Embodied cognition

Thinking is shaped by the body and environment: walking, talking, sitting at a desk, looking at code outdoors, using a phone, or stepping away from the IDE.

Continuum implication:

> Context is not metadata. Context is part of cognition.

### Situated cognition

Thought is situation-dependent. The same person may think differently in different places, times, moods, tasks, and social settings.

Continuum implication:

> Capture location, activity, device, input method, and temporal rhythm where possible, but avoid making the user maintain this manually.

### Cognitive load

Working memory is limited. Systems should reduce the load of remembering, organising, searching, and resuming.

Continuum implication:

> The core exists to remove the user's maintenance loop.

### Metacognition

People benefit from understanding how they think, not only what they think.

Continuum implication:

> Reviews and summaries should help users notice their own patterns without diagnosing them.

### Context-aware computing

Software can adapt based on situation: device, location, time, activity, recent history, and user intent.

Continuum implication:

> Retrieval and resume briefs should be proactively shaped by the user's current context.

### Personal knowledge management

PKM communities already have language for notes, links, backlinks, graphs, evergreen notes, resurfacing, and knowledge gardens.

Continuum should study this language but not inherit all of it. Continuum is not just a note system. It is more ambient, temporal, multimodal, and resume-oriented.

### Cybernetics and systems thinking

Useful language: feedback loops, signal/noise, emergence, self-regulation, adaptive systems.

Continuum implication:

> The product can help create feedback loops between capture, reflection, action, and retrieval.

## Domain languages to avoid overusing

### Clinical or psychiatric language

Use with care. Terms such as mania, depression, rumination, dissociation, or executive dysfunction may be operationally relevant, but they bring medical and regulatory weight.

Continuum should not present itself as diagnosing, treating, or psychoanalysing the user.

Safer framing:

- patterns
- load
- rhythm
- friction
- overload
- stuck loops
- recovery
- grounding

### Mystical pseudo-science language

Avoid vague language such as energy, vibration, alignment, or consciousness hacking unless clearly used as user-authored metaphor.

The tone should be grounded, poetic, and operational.

### Productivity-cult jargon

Avoid making users learn another rigid system. Continuum should reduce maintenance, not create a new productivity religion.

## Suggested Continuum product language

Use words that are simple, audio-friendly, and action-oriented.

Strong candidates:

- **Capture**: getting thought into the system without ceremony.
- **Resume**: returning to a continuation with useful context assembled.
- **Continuation**: an ongoing area of thought, work, job, topic, or situation.
- **Resume Brief**: the compact context needed to restart effectively.
- **Re:**: lightweight continuity marker inspired by email headers.
- **Thought trail**: a path through related captures and resumes.
- **Cognitive context**: the practical situation around a thought: time, place, device, activity, input mode, and recent history.
- **Resonance**: a useful connection between current thought and prior material.
- **Review**: a deliberate pass over recent captures to extract useful structure.
- **Surface**: proactively bring back relevant context.
- **Drift**: movement away from the current continuation.
- **Anchor**: a stable idea, task, person, place, or project that helps organise context.

Use sparingly:

- **Mind state**: useful, but can sound pseudo-clinical or mystical.
- **Cognitive zone**: useful for internal design and power users, but probably not first-run language.
- **Emotional resonance**: useful for optional review, but avoid implying therapy.

## Internal architecture language

For code, schemas, and agents, prefer precise names:

- `CaptureEvent`
- `Continuation`
- `ContextSignal`
- `ResumeBrief`
- `RetrievalCandidate`
- `CognitiveContext`
- `ThoughtSegment`
- `NarrativeSummary`
- `AnchorEntity`
- `ContextSource`
- `ReviewCycle`
- `MemoryLayer`

These map well to both science and product language.

## User-facing language rule

When in doubt, use the language of continuation:

- "Pick up where you left off."
- "Here is the useful context."
- "This seems connected to..."
- "You were circling around..."
- "This keeps coming back."
- "Want to resume this thread?"

Avoid:

- "Your cognition has been classified as..."
- "Your affective state indicates..."
- "Your executive function profile suggests..."
- "The model has detected mania/depression..."

## Positioning sentence

Continuum is not primarily a note app, chatbot, journal, therapist, or task manager.

It is closer to:

> Infrastructure for human thought continuity across contexts and time.

## Practical decision

Adopt the scientific landscape as reference material, not as the product surface.

Use this stack:

1. **Research layer**: distributed cognition, extended mind, embodied cognition, situated cognition, cognitive load, metacognition, context-aware computing.
2. **Technical layer**: capture events, context signals, continuations, retrieval candidates, resume briefs, memory layers.
3. **Product layer**: capture, resume, continuation, thought trail, surface, anchor, review.

This gives Continuum credibility without making it sound like homework.
