# Architecture Notes

## Core idea

Apps should not need to implement their own:

- memory system
- retrieval layer
- continuation inference
- stream segmentation
- semantic ranking
- context assembly

Continuum Core should expose these capabilities as reusable infrastructure.

## High-level flow

```txt
capture -> segment -> infer -> store -> retrieve -> assemble -> continue
```

## Proposed modules

### ingest/

Responsibilities:

- receive audio/text events
- normalise event format
- attach metadata
- support streaming ingestion

Inputs may include:

- microphone audio
- transcripts
- typed text
- app events
- location/device metadata

## segment/

Responsibilities:

- identify topic shifts
- split continuous streams into meaningful units
- infer likely stream boundaries

Potential techniques:

- embedding drift
- silence duration
- entity changes
- explicit protocol markers

## infer/

Responsibilities:

- task extraction
- topic inference
- entity extraction
- unresolved issue detection
- salience estimation

## memory/

Responsibilities:

- summaries
- embeddings
- temporal weighting
- stream linking
- deletion support

Storage should avoid forcing rigid hierarchies.

## retrieve/

Responsibilities:

- proactive retrieval
- continuation assembly
- contextual ranking
- recency balancing
- ambiguity resolution

Retrieval is not a search page.
Retrieval should happen continuously.

## protocol/

Responsibilities:

- parse spoken commands
- detect Resume/Re patterns
- support future protocol extensions

## adapters/

Responsibilities:

- app-specific integration layers
- Jobs Done integration
- Continuant integration
- future SDK wrappers

## Important constraint

Do not prematurely optimise for visual browsing.

The primary interaction model is continuity, not navigation.
