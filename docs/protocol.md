# Protocol Specification

## Overview

Continuum Core uses lightweight spoken or typed commands to indicate continuity and intent.

The protocol should remain:

- audio friendly
- low friction
- memorable
- tolerant of ambiguity

## Core commands

### Resume

Canonical continuation command.

Examples:

```txt
Resume tumble dryer discussion
Resume boiler quote
Resume advert ideas
Resume Jobs Done onboarding
```

Expected behaviour:

- infer likely Continuation
- retrieve relevant context
- surface unresolved items
- construct continuation summary
- optionally speak summary aloud

## Re:

Lightweight shorthand inspired by email threading.

Examples:

```txt
Re kitchen redesign
Re startup pricing
Re plumber customer
```

This may become a more natural protocol once users trust the system.

## Forget

Privacy and deletion commands.

Examples:

```txt
Forget last 10 minutes
Forget this Continuation
Never remember this topic
```

These commands should be implemented carefully and transparently.

## Mark importance

Optional protocol extensions.

Examples:

```txt
This is important
Remember this
Pin this thought
```

The system should not require these to function well.

## Non-goals

The protocol should avoid becoming:

- a command shell
- a prompt engineering system
- a rigid syntax language

Natural language should remain primary.

## ASR considerations

Commands should be:

- easy to transcribe
- easy to distinguish
- low ambiguity
- natural to say aloud

This matters for mobile, driving, workshop, and hands-free scenarios.
