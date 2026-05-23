# Audio Capture Tap Contract

This is the first local interface for source tools such as WhisperWayLand to send captured speech into Continuum without coupling to Continuum internals.

The MVP shape is a local file drop. A source tool writes the raw audio artifact, then atomically writes one JSON envelope into a Landing Queue directory. Continuum processors can read the envelope later.

## Boundary

Capture stays source-tool-owned.

Continuum receives:

- an audio artifact reference
- audio capture health evidence
- raw transcript text
- the text the source tool intended to insert
- capture context
- processor provenance

Continuum does not receive:

- microphone device control
- hotkey handling
- text insertion control
- private API keys

## Landing Queue

Use an explicit environment variable in the source tool:

```text
CONTINUUM_CAPTURE_INLET_DIR=/home/peter/continuum-core/data/landing-queue/audio-captures
```

If the variable is unset, the tap is disabled.

Directory shape:

```text
data/landing-queue/audio-captures/
  artifacts/
    2026-05-23/
      whisper-wayland-20260523T091530123Z-12345-0001.wav
  envelopes/
    whisper-wayland-20260523T091530123Z-12345-0001.json
```

Write rule:

1. Write artifact file.
2. Write envelope to `*.json.tmp`.
3. Rename `*.json.tmp` to `*.json`.

The final rename is the commit point. Continuum should ignore `*.tmp`.

## WhisperWayLand Tap Point

First tap point:

```text
after_batch_transcription_before_text_insertion
```

This means:

- WAV bytes still exist.
- Raw Transcript Text exists.
- post-processed insertion text exists.
- text insertion has not happened yet.

Current code note: WhisperWayLand's `AudioProcessor.transcribe_audio(...)` currently collapses raw transcript and post-processed text into one string. The tap should preserve both values before insertion.

## Audio Capture Health

The source tool is responsible for cheap capture-health checks because it is closest to the microphone and raw WAV bytes. Continuum is responsible for ingestion decisions, review queues, and later user notifications.

WhisperWayLand should compute these values from the WAV bytes before writing the envelope:

- `durationSeconds`
- `byteLength`
- `rmsAmplitude`
- `peakAmplitude`
- `clippingRatio`
- `likelySilent`
- `likelyClipped`

Suggested starting thresholds:

- `likelySilent`: `rmsAmplitude < 0.003` or `peakAmplitude < 0.01`
- `likelyClipped`: `clippingRatio > 0.001`

These are calibration hints, not product truth. If a capture looks bad, still write the artifact and envelope. Mark it as `needs_review` or add health flags; do not silently drop it.

## Envelope

All fields are required. Use discriminated unions later when a field genuinely has different variants.

```json
{
  "schemaVersion": "continuum.audio-capture-tap.v1",
  "captureId": "whisper-wayland:20260523T091530123Z:12345:0001",
  "sourceTool": {
    "name": "whisper-wayland",
    "version": "unknown",
    "repoPath": "/home/peter/whisper-wayland"
  },
  "captureTap": {
    "point": "after_batch_transcription_before_text_insertion",
    "createdAt": "2026-05-23T09:15:30.123Z"
  },
  "audioArtifact": {
    "relativePath": "artifacts/2026-05-23/whisper-wayland-20260523T091530123Z-12345-0001.wav",
    "mimeType": "audio/wav",
    "codec": "pcm_s16le",
    "sampleRateHz": 16000,
    "channelCount": 1,
    "durationSeconds": 3.42,
    "byteLength": 109484,
    "sha256": "hex-encoded-sha256"
  },
  "captureHealth": {
    "durationSeconds": 3.42,
    "byteLength": 109484,
    "rmsAmplitude": 0.026,
    "peakAmplitude": 0.41,
    "clippingRatio": 0,
    "likelySilent": false,
    "likelyClipped": false,
    "checks": [
      {
        "kind": "rms_level",
        "status": "pass",
        "text": "RMS amplitude is above the likely-silent threshold.",
        "confidence": 1
      }
    ]
  },
  "transcript": {
    "rawTranscriptText": "closest transcript from the transcription provider",
    "insertionText": "text WhisperWayLand is about to insert",
    "postProcessMode": "raw"
  },
  "captureContext": {
    "hostApp": "whisper-wayland",
    "captureInlet": "local-file-drop",
    "deviceLabel": "system default microphone",
    "membraneDecision": "accepted",
    "contextClues": [
      {
        "kind": "activation",
        "text": "push-to-talk hotkey released",
        "confidence": 1,
        "observedAt": "2026-05-23T09:15:30.123Z"
      }
    ]
  },
  "processor": {
    "provider": "openai",
    "processorId": "gpt-4o-transcribe",
    "processorVersion": "unknown",
    "processorKind": "transcription",
    "configurationFingerprint": "16-lowercase-hex",
    "knowledgeTime": "2026-05-23T09:15:30.123Z"
  }
}
```

## Privacy

This is raw private audio. The local dogfooding membrane is permissive, but the write is still explicit:

- no environment variable means no capture
- write only local files
- no network call to Continuum
- no silent dropping after the artifact is accepted
- likely-silent or clipped captures are still written with Capture Health
- envelope must preserve enough provenance to erase or rebuild later

## First Consumer

Continuum Core already has `AudioArtifact`, `AudioProcessingJob`, `AudioObservation`, and the `continuum-audio-signals` WAV harness. The next consumer should read these envelopes and create Audio Artifacts plus Raw Transcript Text observations.
