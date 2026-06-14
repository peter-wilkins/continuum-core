#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import {
  runCodexConversationFlowBatch,
  type CodexConversationFlowBatchCommand,
} from "./codex-conversation-flow";

type ParsedCli = {
  rootPath: string;
  outputDirectory: string;
  manifestPath: string;
  limit: number;
  minimumSourceBytes: number;
  minimumAgeSeconds: number;
  maxMessageBytes: number;
  deleteRawAfterProjection: boolean;
  skipManifestRecordedSources: boolean;
};

function parseCli(args: string[]): ParsedCli {
  const [rootPath, ...flags] = args;

  if (!rootPath) {
    throw new Error(
      "Usage: continuum-codex-conversation-flow-batch <blob-root> --delete-raw-after-projection [--out local/codex-session-conversations] [--limit 25] [--minimum-source-bytes 1048576]",
    );
  }

  const parsed: ParsedCli = {
    rootPath,
    outputDirectory: "local/codex-session-conversations/conversation-flow",
    manifestPath: "local/codex-session-conversations/conversation-flow-manifest.jsonl",
    limit: 25,
    minimumSourceBytes: 1024 * 1024,
    minimumAgeSeconds: 60,
    maxMessageBytes: 12000,
    deleteRawAfterProjection: false,
    skipManifestRecordedSources: true,
  };

  for (let index = 0; index < flags.length; index += 1) {
    const flag = flags[index];

    if (!flag) {
      throw new Error("Unexpected empty flag.");
    }

    if (flag === "--delete-raw-after-projection") {
      parsed.deleteRawAfterProjection = true;
      continue;
    }

    if (flag === "--include-manifest-recorded-sources") {
      parsed.skipManifestRecordedSources = false;
      continue;
    }

    const value = flags[index + 1];

    if (!value) {
      throw new Error(`${flag} needs a value.`);
    }

    index += 1;

    if (flag === "--out") {
      parsed.outputDirectory = value;
      continue;
    }

    if (flag === "--manifest") {
      parsed.manifestPath = value;
      continue;
    }

    if (flag === "--limit") {
      parsed.limit = parsePositiveInteger(value, flag);
      continue;
    }

    if (flag === "--minimum-source-bytes") {
      parsed.minimumSourceBytes = parseNonNegativeInteger(value, flag);
      continue;
    }

    if (flag === "--minimum-age-seconds") {
      parsed.minimumAgeSeconds = parseNonNegativeInteger(value, flag);
      continue;
    }

    if (flag === "--max-message-bytes") {
      parsed.maxMessageBytes = parsePositiveInteger(value, flag);
      continue;
    }

    throw new Error(`Unknown flag: ${flag}`);
  }

  return parsed;
}

export async function runCodexConversationFlowBatchCli(args: string[]): Promise<{
  summaryPath: string;
  processedCount: number;
  deletedCount: number;
  sourceBytesDeleted: number;
  outputBytesWritten: number;
}> {
  const parsed = parseCli(args);
  const generatedAt = new Date().toISOString();
  const command: CodexConversationFlowBatchCommand = {
    rootPath: parsed.rootPath,
    outputDirectory: parsed.outputDirectory,
    manifestPath: parsed.manifestPath,
    limit: parsed.limit,
    minimumSourceBytes: parsed.minimumSourceBytes,
    minimumAgeSeconds: parsed.minimumAgeSeconds,
    maxMessageBytes: parsed.maxMessageBytes,
    deleteRawAfterProjection: parsed.deleteRawAfterProjection,
    skipManifestRecordedSources: parsed.skipManifestRecordedSources,
    generatedAt,
  };
  const result = await runCodexConversationFlowBatch(command);
  const summaryPath = join(resolve(parsed.outputDirectory), `batch-summary-${generatedAt.replaceAll(":", "").replaceAll("-", "")}.json`);
  await writeFile(summaryPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

  return {
    summaryPath,
    processedCount: result.processedCount,
    deletedCount: result.deletedCount,
    sourceBytesDeleted: result.sourceBytesDeleted,
    outputBytesWritten: result.outputBytesWritten,
  };
}

function parsePositiveInteger(value: string, flag: string): number {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`${flag} must be a positive integer`);
  }

  return parsed;
}

function parseNonNegativeInteger(value: string, flag: string): number {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`${flag} must be zero or a positive integer`);
  }

  return parsed;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCodexConversationFlowBatchCli(process.argv.slice(2))
    .then((result) => {
      process.stdout.write(
        `Processed: ${result.processedCount}\nDeleted raw blobs: ${result.deletedCount}\nSource bytes deleted: ${result.sourceBytesDeleted}\nOutput bytes written: ${result.outputBytesWritten}\nSummary: ${result.summaryPath}\n`,
      );
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`${message}\n`);
      process.exitCode = 1;
    });
}
