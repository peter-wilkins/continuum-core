# Audio Capture Owned By Hosts, Processing Adapter First

Continuum should not own platform microphone capture in the shared core. Android apps, Linux tools such as WhisperWayLand, browsers, and future native shells should capture audio using the best local mechanism for that platform.

Continuum should own the shared processing boundary around captured audio artifacts. A Host App or Capture Tap can submit an Audio Artifact reference with required Capture Context. Audio processors then produce rebuildable observations such as Raw Transcript Text, speech segments, prosodic features, tone hypotheses, intent hypotheses, diarization, or sentiment.

These observations are evidence, not source truth. They must retain processor provenance, model or ruleset identity, label scheme, confidence, processing time, and links back to the raw Audio Artifact or bounded audio segment. Raw audio remains highly private and must pass through a File System Membrane and Landing Queue before durable storage.

This keeps the architecture open:

- Linux can keep Python capture where it is strongest.
- Android can use native capture and permissions.
- TypeScript can define the shared contract and host provider adapters.
- Python, native, WebAssembly, hosted APIs, or local models can all implement processors.
- Public labelled speech datasets can become benchmark and training material without becoming product source truth.

The first implementation should define types and a fake processor before integrating real providers. Real provider order should start with transcription, then cheap acoustic/prosodic features, then tone or intent hypotheses once benchmark data exists.

## Consequences

- Capture device code stays out of Continuum Core unless a Host App explicitly owns it.
- Audio processors should be ports/adapters with deterministic test fixtures.
- Tone, sentiment, and intent labels must be treated as uncertain observations.
- Dataset licences must be checked before model training, benchmarking, or product use.
- Derived datasets should not be imported as separate source truth when they duplicate an upstream dataset.
