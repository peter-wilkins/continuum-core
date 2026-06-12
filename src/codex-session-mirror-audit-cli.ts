#!/usr/bin/env node

import {
  auditCodexSessionMirror,
  createTimestampedCodexSessionMirrorReportDirectory,
  writeCodexSessionMirrorAuditReport,
  type CodexSessionMirrorAuditCommand,
} from "./codex-session-mirror-audit";

type ParsedCli = {
  rootPath: string;
  outputBaseDirectory: string;
  largestFileLimit: number;
  newestOldestLimit: number;
  sampleFileLimit: number;
  sampleLineLimit: number;
  duplicateHashByteLimit: number;
};

function parseCli(args: string[]): ParsedCli {
  const [rootPath, ...flags] = args;

  if (!rootPath) {
    throw new Error(
      "Usage: continuum-codex-session-mirror-audit <session-mirror-dir> [--out local/reports] [--largest 20] [--sample-files 6] [--sample-lines 200] [--duplicate-hash-byte-limit 2147483648]",
    );
  }

  const parsed: ParsedCli = {
    rootPath,
    outputBaseDirectory: "local/reports",
    largestFileLimit: 20,
    newestOldestLimit: 10,
    sampleFileLimit: 6,
    sampleLineLimit: 200,
    duplicateHashByteLimit: 2 * 1024 * 1024 * 1024,
  };

  for (let index = 0; index < flags.length; index += 2) {
    const flag = flags[index];
    const value = flags[index + 1];

    if (!flag || !value) {
      throw new Error("Flags must be supplied as --name value pairs.");
    }

    if (flag === "--out") {
      parsed.outputBaseDirectory = value;
      continue;
    }

    if (flag === "--largest") {
      parsed.largestFileLimit = parsePositiveInteger(value, flag);
      continue;
    }

    if (flag === "--newest-oldest") {
      parsed.newestOldestLimit = parsePositiveInteger(value, flag);
      continue;
    }

    if (flag === "--sample-files") {
      parsed.sampleFileLimit = parsePositiveInteger(value, flag);
      continue;
    }

    if (flag === "--sample-lines") {
      parsed.sampleLineLimit = parsePositiveInteger(value, flag);
      continue;
    }

    if (flag === "--duplicate-hash-byte-limit") {
      parsed.duplicateHashByteLimit = parseNonNegativeInteger(value, flag);
      continue;
    }

    throw new Error(`Unknown flag: ${flag}`);
  }

  return parsed;
}

export async function runCodexSessionMirrorAuditCli(args: string[]): Promise<{
  jsonPath: string;
  markdownPath: string;
  fileCount: number;
  totalBytes: number;
}> {
  const parsed = parseCli(args);
  const generatedAt = new Date().toISOString();
  const outputDirectory = createTimestampedCodexSessionMirrorReportDirectory(
    parsed.outputBaseDirectory,
    generatedAt,
  );
  const command: CodexSessionMirrorAuditCommand = {
    rootPath: parsed.rootPath,
    outputDirectory,
    generatedAt,
    largestFileLimit: parsed.largestFileLimit,
    newestOldestLimit: parsed.newestOldestLimit,
    sampleFileLimit: parsed.sampleFileLimit,
    sampleLineLimit: parsed.sampleLineLimit,
    duplicateHashByteLimit: parsed.duplicateHashByteLimit,
  };
  const report = await auditCodexSessionMirror(command);
  const paths = await writeCodexSessionMirrorAuditReport(command, report);

  return {
    jsonPath: paths.jsonPath,
    markdownPath: paths.markdownPath,
    fileCount: report.totals.fileCount,
    totalBytes: report.totals.totalBytes,
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
  runCodexSessionMirrorAuditCli(process.argv.slice(2))
    .then((result) => {
      process.stdout.write(
        `Wrote Codex session mirror audit: ${result.markdownPath}\nJSON: ${result.jsonPath}\nFiles: ${result.fileCount}\nBytes: ${result.totalBytes}\n`,
      );
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`${message}\n`);
      process.exitCode = 1;
    });
}
