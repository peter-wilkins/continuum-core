# 078: Map RAVDESS Labels To Audio Observations

Status: ready

## Type

AFK.

## Context

The first audio signal harness can read a real RAVDESS WAV and emit deterministic acoustic Audio Observations. The next useful vertical slice is to map one public labelled dataset's filename labels into benchmark Audio Observations so processors can be compared against known labels.

RAVDESS is a good first target because the fetched zip contains real WAV files and filename-encoded labels. CREMA-D is also high value, but the current clone contains Git LFS pointers because `git-lfs` is not installed locally.

## What To Build

Add a small RAVDESS benchmark adapter that reads one WAV path or zip member name and creates a `benchmark_label` Audio Observation for emotion and intensity labels.

## First failing test

`maps one RAVDESS filename into benchmark label Audio Observations`

## Acceptance Criteria

- [ ] Parse one RAVDESS filename such as `03-01-05-02-01-01-01.wav`.
- [ ] Decode modality, vocal channel, emotion, emotional intensity, statement, repetition, and actor.
- [ ] Create a `benchmark_label` Audio Observation with explicit label scheme and confidence.
- [ ] Preserve the source filename as evidence.
- [ ] Do not infer sentiment or tone beyond the dataset label scheme.
- [ ] Add a fixture or test that does not require unpacking the full dataset.
- [ ] Document RAVDESS licence as non-commercial by default.

## Blocked by

- None.

## Out Of Scope

- Training models.
- Batch processing the whole RAVDESS archive.
- Mapping CREMA-D labels.
- Installing `git-lfs`.
