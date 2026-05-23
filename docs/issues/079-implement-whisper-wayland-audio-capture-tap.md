# 079: Implement WhisperWayLand Audio Capture Tap

Status: ready

## Type

Cross-repo.

## Context

The priority is to start capturing real dogfooding audio so Continuum can build a private local dataset. WhisperWayLand already owns Linux microphone capture and has the right batch-mode point where WAV bytes and transcript text are both available.

Audio quality responsibility is split: WhisperWayLand owns cheap capture-health evidence because it is closest to the microphone; Continuum owns ingestion judgement, review, quarantine, and later user notifications.

Core contract:

- `docs/audio-capture-tap-contract.md`
- `CONTEXT.md` terms: Capture Tap, Capture Inlet, Landing Queue, Audio Artifact, Audio Observation

WhisperWayLand hook point:

- `/home/peter/whisper-wayland/whisper_wayland/application/transcription_processor.py`
- `/home/peter/whisper-wayland/whisper_wayland/application/audio_processor.py`

## What To Build

In WhisperWayLand, add an opt-in Capture Tap that writes local WAV artifacts and JSON envelopes to `CONTINUUM_CAPTURE_INLET_DIR`.

## First failing test

`writes a capture envelope after batch transcription and before text insertion`

## Acceptance Criteria

- [ ] Tap is disabled when `CONTINUUM_CAPTURE_INLET_DIR` is unset.
- [ ] Tap writes the WAV bytes to `artifacts/YYYY-MM-DD/*.wav`.
- [ ] Tap writes one envelope to `envelopes/*.json` using atomic `*.tmp` then rename.
- [ ] Envelope follows `docs/audio-capture-tap-contract.md`.
- [ ] Envelope includes both Raw Transcript Text and insertion text.
- [ ] Envelope includes Capture Health: duration, byte length, RMS amplitude, peak amplitude, clipping ratio, likely-silent flag, and likely-clipped flag.
- [ ] Likely-silent or clipped captures are still written; do not silently drop them.
- [ ] Batch mode preserves raw transcript before post-processing.
- [ ] Capture id does not use UUID; use timestamp + process id + counter or equivalent inspectable id.
- [ ] Existing text insertion behaviour is unchanged.
- [ ] Unit tests cover disabled tap, enabled tap, and atomic envelope write.

## Blocked by

- None.

## Out Of Scope

- Streaming transcription tap.
- Continuum ingestion of the envelopes.
- Android capture.
- Tone/sentiment processing.
- Uploading audio anywhere.
