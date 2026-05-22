# 076: Model Audio Processing Module Contract

Status: done

## Type

AFK.

## Context

The project should not port WhisperWayLand wholesale. Platform capture belongs in the host or platform tool: Android captures audio natively, Linux can keep using Python, and browsers can use Web APIs.

Continuum needs the shared processing boundary after audio exists: transcription first, then tone, prosody, sentiment, intent, diarization, and other observations that transcription alone does not preserve.

## What To Build

Add a TypeScript contract for audio processing without implementing native capture.

## What Was Built

Added the first audio processing contract and deterministic PCM16 WAV signal harness. The harness produces acoustic Audio Observations from a local WAV file without owning microphone capture.

## First failing test

`models one audio artifact and one transcript observation with processor provenance`

## Acceptance Criteria

- [x] Define an Audio Artifact reference type with required capture context and no optional fields.
- [x] Define an Audio Processing Job type that links an artifact or bounded segment to one processor.
- [x] Define processor provenance with provider, processor id, version, configuration fingerprint, and knowledge time.
- [x] Define transcript observation output for Raw Transcript Text and timed transcript segments.
- [x] Define non-transcript observation output for acoustic, tone, sentiment, intent, diarization, or other future labels.
- [x] Require confidence and label scheme for uncertain tone, sentiment, intent, and diarization outputs.
- [x] Treat all processor outputs as evidence, not source truth.
- [x] Keep capture device APIs out of this slice.
- [x] Add one fake processor test fixture.
- [x] Document how public labelled speech datasets can be mapped into benchmark observations without becoming product source truth.

## Blocked by

- None.

## Out Of Scope

- Android microphone capture.
- Linux key monitoring or text insertion.
- Calling OpenAI or any hosted API.
- Training tone or sentiment models.
- Downloading large public datasets.
- Persisting audio artifacts to a real store.
