# 079: Implement WhisperWayLand Audio Capture Tap

Status: done

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

- [x] Tap is disabled when `CONTINUUM_CAPTURE_INLET_DIR` is unset.
- [x] Tap writes the WAV bytes to `artifacts/YYYY-MM-DD/*.wav`.
- [x] Tap writes one envelope to `envelopes/*.json` using atomic `*.tmp` then rename.
- [x] Envelope follows `docs/audio-capture-tap-contract.md`.
- [x] Envelope includes both Raw Transcript Text and insertion text.
- [x] Envelope includes Capture Health: duration, byte length, RMS amplitude, peak amplitude, clipping ratio, likely-silent flag, and likely-clipped flag.
- [x] Likely-silent or clipped captures are still written; do not silently drop them.
- [x] Batch mode preserves raw transcript before post-processing.
- [x] Capture id does not use UUID; use timestamp + process id + counter or equivalent inspectable id.
- [x] Existing text insertion behaviour is unchanged.
- [x] Unit tests cover disabled tap, enabled tap, and atomic envelope write.

## Implementation

Implemented in `/home/peter/whisper-wayland` on branch:

```text
roland/ad-hoc/continuum-audio-capture-metadata
```

Current verified commit:

```text
4877c8e Guard ydotool insertion against stuck modifiers
```

Relevant files:

- `whisper_wayland/application/capture_tap.py`
- `whisper_wayland/application/transcription_processor.py`
- `whisper_wayland/application/audio_processor.py`
- `tests/unit/test_capture_tap.py`

## Verification

```bash
.venv/bin/python -m pytest tests/unit/test_capture_tap.py
```

Result: 11 passed.

## Blocked by

- None.

## Out Of Scope

- Streaming transcription tap.
- Continuum ingestion of the envelopes.
- Android capture.
- Tone/sentiment processing.
- Uploading audio anywhere.
