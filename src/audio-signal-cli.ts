#!/usr/bin/env node

import { readFile, stat, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  analyzePcm16WavAudioSignal,
  createAudioArtifact,
  createAudioProcessingJob,
  inspectPcm16WavAudioFormat,
} from "./index";

type AudioSignalCliCommand = {
  inputPath: string;
  outputPath: string;
};

function parseAudioSignalCliCommand(args: string[]): AudioSignalCliCommand {
  const [inputPath, outFlag, outputPath] = args;

  if (!inputPath || outFlag !== "--out" || !outputPath) {
    throw new Error("Usage: continuum-audio-signals <audio.wav> --out <signals.json>");
  }

  return { inputPath, outputPath };
}

export async function runContinuumAudioSignalCli(
  args: string[],
): Promise<{ outputPath: string; signalCount: number }> {
  const command = parseAudioSignalCliCommand(args);
  const absoluteInputPath = resolve(command.inputPath);
  const wavBytes = await readFile(absoluteInputPath);
  const fileStat = await stat(absoluteInputPath);
  const inspected = inspectPcm16WavAudioFormat(wavBytes);
  const capturedAt = fileStat.mtime.toISOString();
  const processedAt = new Date().toISOString();
  const artifact = createAudioArtifact({
    id: `audio-artifact:local:${basename(absoluteInputPath)}:${fileStat.mtimeMs}`,
    location: {
      kind: "local_path",
      value: absoluteInputPath,
    },
    format: inspected,
    captureContext: {
      capturedAt,
      hostApp: "continuum-audio-signals",
      captureInlet: "local-file",
      captureTap: "manual-harness",
      deviceLabel: "unknown local audio source",
      membraneDecision: "needs_review",
      contextClues: [
        {
          kind: "local_path",
          text: absoluteInputPath,
          confidence: 1,
          observedAt: processedAt,
        },
      ],
    },
    provenance: {
      sourceName: "local_audio_file",
      sourceRecordId: absoluteInputPath,
      sourceUrl: pathToFileURL(absoluteInputPath).href,
      license: "Unknown local file licence.",
      retrievedAt: processedAt,
    },
  });
  const job = createAudioProcessingJob({
    id: `audio-processing-job:pcm16-wav-basic-signals:${basename(absoluteInputPath)}:${Date.now()}`,
    artifactId: artifact.id,
    segment: {
      startSeconds: 0,
      endSeconds: inspected.durationSeconds,
    },
    processor: {
      provider: "continuum-core",
      processorId: "processor:continuum:pcm16-wav-basic-signals",
      processorVersion: "1.0.0",
      processorKind: "acoustic",
      configurationFingerprint: "0000000000000001",
      knowledgeTime: processedAt,
    },
  });
  const observation = analyzePcm16WavAudioSignal({
    id: `audio-observation:signals:${basename(absoluteInputPath)}:${Date.now()}`,
    artifact,
    job,
    wavBytes,
  });
  const output = {
    artifact,
    job,
    observation,
  };

  await writeFile(command.outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  return {
    outputPath: command.outputPath,
    signalCount: observation.signals.length,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runContinuumAudioSignalCli(process.argv.slice(2))
    .then((result) => {
      process.stdout.write(
        `Wrote ${result.signalCount} audio signals to ${result.outputPath}\n`,
      );
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`${message}\n`);
      process.exitCode = 1;
    });
}
