# Tone, Prosody, and Cognitive State

## Core idea

Transcript text alone loses a large amount of meaning.

Example:

```txt
Fine.
```

Without tone/prosody, the system cannot distinguish:

- frustration
- exhaustion
- sarcasm
- relief
- calm agreement

Continuum should treat tone as a weak probabilistic signal that improves continuity quality.

## Important distinction

This is NOT primarily about emotion dashboards.

The more useful target is:

- cognitive state
- state transitions
- salience
- urgency
- unresolved tension
- confidence/uncertainty

Rather than simplistic labels such as:

- happy
- sad
- angry

## Potential uses

### Memory weighting

Things spoken with:

- emotional emphasis
- repetition
- urgency
- excitement
- stress

may deserve stronger retention weighting.

## Retrieval ranking

Examples:

- stressed/overloaded -> shorter summaries, fewer options
- reflective -> broader contextual retrieval
- decisive -> surface action items first

## Continuation segmentation

Tone shifts may indicate:

- entering work mode
- brainstorming mode
- execution mode
- topic transitions
- emotional transitions

## Assistant adaptation

Possible behavioural adaptation:

- concise when rushed
- exploratory when reflective
- direct when decisive

Without explicit manual mode switches.

## Ethical boundary

Tone/emotional signals must NOT become:

- manipulative engagement optimisation
- emotional dependency systems
- therapy simulation
- mood maximisation loops

Avoid:

- emotional scoring dashboards
- fake psychological certainty
- claims of deep emotional understanding
- engagement-driven emotional steering

## Critical principle

The system should optimise for:

- continuity
- clarity
- coherence
- reduced friction
- reduced overwhelm
- task continuity

NOT:

- happiness maximisation
- emotional capture
- infinite soothing

## Important warning

Human flourishing often involves:

- tension
- uncertainty
- frustration
- obsession
- difficult tasks

A continuity system should support agency and intentionality rather than attempting to flatten negative emotional states.

## Safer framing

Good:

```txt
The user sounds overloaded -> reduce cognitive load.
The user sounds uncertain -> retrieve related prior thinking.
The user sounds decisive -> surface action items.
```

Bad:

```txt
The user sounds sad -> maximise engagement.
The user sounds lonely -> prolong interaction.
The user sounds stressed -> permanently suppress difficult topics.
```

## Architectural sketch

```txt
audio
  -> transcript
  -> prosody features
  -> salience estimation
  -> retrieval weighting
```

Not:

```txt
audio
  -> emotional analytics dashboard
```
