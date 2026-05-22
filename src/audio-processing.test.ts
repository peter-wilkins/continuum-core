import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";

import {
  analyzePcm16WavAudioSignal,
  createAudioArtifact,
  createAudioProcessingJob,
  createAudioSignalObservation,
  createAudioTranscriptObservation,
} from "./index";

const validArtifactInput = {
  id: "audio-artifact:voice:2026-05-22T22:30:00.000Z",
  location: {
    kind: "local_path" as const,
    value: "data/audio-datasets/fixtures/example.wav",
  },
  format: {
    mimeType: "audio/wav",
    codec: "pcm_s16le",
    sampleRateHz: 16000,
    channelCount: 1,
    durationSeconds: 1,
    byteLength: 32044,
  },
  captureContext: {
    capturedAt: "2026-05-22T22:30:00.000Z",
    hostApp: "continuum-core-test",
    captureInlet: "fixture",
    captureTap: "fixture:after-audio",
    deviceLabel: "synthetic wav fixture",
    membraneDecision: "accepted" as const,
    contextClues: [
      {
        kind: "fixture",
        text: "Synthetic mono PCM16 WAV used for deterministic testing.",
        confidence: 1,
        observedAt: "2026-05-22T22:30:00.000Z",
      },
    ],
  },
  provenance: {
    sourceName: "continuum fixture",
    sourceRecordId: "fixture:audio:one-second",
    sourceUrl: "https://example.com/audio-fixture",
    license: "Synthetic test fixture.",
    retrievedAt: "2026-05-22T22:30:00.000Z",
  },
};

const validProcessorProvenance = {
  provider: "continuum-core",
  processorId: "processor:continuum:test-transcriber",
  processorVersion: "1.0.0",
  processorKind: "transcription" as const,
  configurationFingerprint: "abc123def4567890",
  knowledgeTime: "2026-05-22T22:31:00.000Z",
};

describe("Audio Processing", () => {
  it("models one audio artifact and one transcript observation with processor provenance", () => {
    const artifact = createAudioArtifact(validArtifactInput);
    const job = createAudioProcessingJob({
      id: "audio-processing-job:transcribe:fixture",
      artifactId: artifact.id,
      segment: {
        startSeconds: 0,
        endSeconds: 1,
      },
      processor: validProcessorProvenance,
    });
    const observation = createAudioTranscriptObservation({
      id: "audio-observation:transcript:fixture",
      jobId: job.id,
      artifactId: artifact.id,
      processor: job.processor,
      transcriptText: "Hello Continuum.",
      segments: [
        {
          id: "audio-segment:fixture:0",
          startSeconds: 0,
          endSeconds: 1,
          text: "Hello Continuum.",
          confidence: 0.97,
        },
      ],
      confidence: 0.97,
    });

    expect(observation).toMatchObject({
      id: "audio-observation:transcript:fixture",
      kind: "transcript",
      transcriptText: "Hello Continuum.",
      processor: {
        provider: "continuum-core",
        processorId: "processor:continuum:test-transcriber",
        processorVersion: "1.0.0",
        processorKind: "transcription",
        configurationFingerprint: "abc123def4567890",
        knowledgeTime: "2026-05-22T22:31:00.000Z",
      },
    });
  });

  it("rejects uncertain audio labels without confidence and a label scheme", () => {
    const artifact = createAudioArtifact(validArtifactInput);
    const job = createAudioProcessingJob({
      id: "audio-processing-job:tone:fixture",
      artifactId: artifact.id,
      segment: {
        startSeconds: 0,
        endSeconds: 1,
      },
      processor: {
        ...validProcessorProvenance,
        processorId: "processor:continuum:test-tone",
        processorKind: "tone",
      },
    });

    expect(() =>
      createAudioSignalObservation({
        id: "audio-observation:tone:fixture",
        jobId: job.id,
        artifactId: artifact.id,
        processor: job.processor,
        signalKind: "tone",
        labelScheme: {
          id: " ",
          version: "1.0.0",
          labels: ["calm"],
        },
        signals: [
          {
            label: "calm",
            value: 0.7,
            confidence: 0.8,
            evidence: "Synthetic fixture label.",
          },
        ],
      }),
    ).toThrow("AudioLabelScheme id must not be blank.");
  });

  it("extracts deterministic acoustic signals from a PCM16 WAV buffer", () => {
    const artifact = createAudioArtifact({
      ...validArtifactInput,
      format: {
        ...validArtifactInput.format,
        durationSeconds: 0.25,
        byteLength: 8044,
      },
    });
    const job = createAudioProcessingJob({
      id: "audio-processing-job:signals:fixture",
      artifactId: artifact.id,
      segment: {
        startSeconds: 0,
        endSeconds: 0.25,
      },
      processor: {
        provider: "continuum-core",
        processorId: "processor:continuum:pcm16-wav-basic-signals",
        processorVersion: "1.0.0",
        processorKind: "acoustic",
        configurationFingerprint: "0000000000000001",
        knowledgeTime: "2026-05-22T22:31:00.000Z",
      },
    });

    const observation = analyzePcm16WavAudioSignal({
      id: "audio-observation:signals:fixture",
      artifact,
      job,
      wavBytes: createPcm16Wav([0, 32767, -32768, 0], 16000),
    });

    expect(observation).toMatchObject({
      kind: "signals",
      signalKind: "acoustic",
      labelScheme: {
        id: "continuum.audio.acoustic.basic",
        version: "1.0.0",
        labels: [
          "duration_seconds",
          "rms_amplitude",
          "peak_amplitude",
          "clipping_ratio",
        ],
      },
      signals: [
        { label: "duration_seconds", value: 0.00025, confidence: 1 },
        { label: "rms_amplitude", value: 0.707, confidence: 1 },
        { label: "peak_amplitude", value: 1, confidence: 1 },
        { label: "clipping_ratio", value: 0.5, confidence: 1 },
      ],
    });
  });
});

function createPcm16Wav(samples: number[], sampleRate: number): Uint8Array {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataSize, 40);

  samples.forEach((sample, index) => {
    buffer.writeInt16LE(sample, 44 + index * 2);
  });

  return buffer;
}
