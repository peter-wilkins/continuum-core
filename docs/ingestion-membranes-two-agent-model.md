# Ingestion Membranes and the Two-Agent Model

## Core Idea

Continuum should separate:

- greedy capture
- intelligent curation

The system works through layered "ingestion membranes" rather than a single flat memory store.

Different membranes have different permeability, permissions, and optimisation goals.

---

# The Two-Agent Model

## Recorder Agent

Purpose:

> Capture signal without judging meaning.

### Allowed

- Capture greedily
- Preserve raw audio/text
- Store lightweight metadata
  - time
  - location
  - device
  - mode
- Detect rough thought boundaries
- Learn user vocabulary
- Ask minimal repair questions

### Not Allowed

- Deep interpretation
- Aggressive summarisation
- Rejecting thoughts
- Task creation
- Therapy-style responses
- Polluting the continuum with premature meaning

### Recorder Motto

> "Get it down."

---

## Curator Agent

Purpose:

> Protect the continuum from overload and noise.

### Allowed

- Filter junk
- Merge duplicates
- Connect related ideas
- Ask clarification questions
- Suggest labels
- Upgrade captures into structured entries
- Learn what the user values
- Compare new captures against existing goals/projects

### Not Allowed

- Overwriting raw capture
- Treating uncertainty as certainty
- Over-organising too early
- Turning every thought into a task
- Blindly importing everything

### Curator Motto

> "Earn its place."

---

# Ingestion Membranes

## 1. Capture Membrane

Very permeable.

Optimises for:

- low friction
- low anxiety
- preserving flow
- avoiding thought loss

Allows:

- fragments
- contradictions
- emotional residue
- repetitions
- half-formed thoughts

---

## 2. Curation Membrane

Selective permeability.

Questions:

- Is this useful?
- Is this novel?
- Is this recurring?
- Is this emotionally important?
- Does this connect to existing structures?
- Is this temporary noise?

Most captures should stop here.

---

## 3. Identity Membrane

Very strict.

Determines what becomes part of:

- long-term memory
- goals
- habits
- worldview
- identity

Must resist:

- temporary mania
- doom spirals
- random obsessions
- AI sycophancy
- impulsive imports

---

## 4. Action Membrane

Converts thought into commitment.

Examples:

- goals
- tasks
- reminders
- research topics
- habits

Very few items should cross this membrane.

Otherwise the user becomes overwhelmed by self-generated administration.

---

# Architectural Principle

Raw capture is cheap.

Curated memory is expensive.

Pipeline:

```text
Raw Capture
→ Candidate Insight
→ Curated Entry
→ Goal / Project / Task / Reference
```

Most captured material should never become a permanent structured entry.

That is healthy.

---

# Biological Inspiration

The model intentionally mirrors biological systems:

- cell membranes
- stomach filtering
- immune systems
- blood-brain barrier
- sleep consolidation
- attention systems

Humans survive through selective permeability, not total recall.

---

# Important Product Insight

Most AI memory systems fail because they treat all input equally.

Continuum instead treats memory as:

- layered
- filtered
- adaptive
- emotionally weighted
- curator-guided

The recorder and curator are not just separate chatbots.

They are:

- different permissions
- different optimisation goals
- different permeability levels

Recorder:

> Never lose signal.

Curator:

> Never poison the continuum.
