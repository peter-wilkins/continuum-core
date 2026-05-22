# Architecture Notes

## Core idea

Apps should not need to implement their own:

- memory system
- retrieval layer
- continuation inference
- Continuation segmentation
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
- attach Capture Context
- support incremental ingestion

Inputs may include:

- microphone audio
- transcripts
- typed text
- app events
- location/device Context Clues

## segment/

Responsibilities:

- identify topic shifts
- split continuous capture into meaningful units
- infer likely Continuation boundaries

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
- Continuation linking
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

## Shared Utility Projects

Some reusable behavior should live outside Continuum Core as a separate library repo when it is useful to multiple products but is not part of the Continuum domain model.

Examples:

- workflow-manager helpers
- cross-agent resource leasing utilities
- shared command/report formatting
- local development coordination tools

Use a Shared Utility Project when the same utility belongs in Continuum apps and workflow-manager land. Do not put that code in Continuum Core unless it directly expresses Continuum domain behavior.

## Important constraint

Do not prematurely optimise for visual browsing.

The primary interaction model is continuity, not navigation.
