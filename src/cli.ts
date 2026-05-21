#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import { basename } from "node:path";

import {
  type ImportErrorRecord,
  mergeCanonicalEvents,
  type CanonicalEvent,
  type ImportReport,
} from "./index";
import {
  normalizeArchiveFiles,
  readTakeoutArchive,
  type ArchiveSourceFile,
  type SourceFilePreview,
} from "./archive-intake";
import {
  importCommands,
  isArchiveImportCommand,
  isImportCommand,
  isSourceImportCommand,
  normalizeSourceInput,
  sourceInputNeedsJson,
  prepareSourceInput,
  type ImportCommand,
} from "./import-source-adapters";

export type ImportBatch = {
  id: string;
  sourcePlatform: ImportCommand;
  sourceName: string;
  originalFilename: string;
  originalFileHash: string;
  createdAt: string;
  completedAt: string | null;
  status: "parsed" | "normalized" | "previewed" | "approved" | "failed";
  stats: {
    filesSeen: number;
    recordsSeen: number;
    eventsCreated: number;
    eventsKnown: number;
    eventsChanged: number;
    eventsUncertain: number;
    recordsQuarantined: number;
    warnings: number;
  };
};

export type ImportPreview = {
  batch: ImportBatch;
  report: ImportReport;
  quarantine: ImportErrorRecord[];
  sourceFiles: SourceFilePreview[];
  events: Array<{
    id: string;
    platform: string;
    role: string;
    createdAt: string;
    subject: string | null;
  }>;
};

export type ImportWriteCliResult = {
  command: "import";
  eventsWritten: number;
  outputPath: string;
  report: ImportReport;
  quarantine: ImportErrorRecord[];
  warnings: number;
};

export type InspectCliResult = {
  command: "inspect";
  sourcePlatform: ImportCommand;
  sourceName: string;
  inputPath: string;
  conversationsSeen: number;
  recordsSeen: number;
  validationErrors: number;
  importableEvents: number;
  warnings: number;
  sourceFiles: SourceFilePreview[];
};

export type DryRunCliResult = {
  command: "dry-run";
  previewPath: string;
  batch: ImportBatch;
  report: ImportReport;
  quarantine: ImportErrorRecord[];
};

export type ContinuumImportCliResult =
  | ImportWriteCliResult
  | InspectCliResult
  | DryRunCliResult;

type CliCommand =
  | {
      kind: "import";
      source: ImportCommand;
      inputPath: string;
      outputPath: string;
    }
  | {
      kind: "inspect";
      source: ImportCommand;
      inputPath: string;
    }
  | {
      kind: "dry-run";
      source: ImportCommand;
      inputPath: string;
      previewPath: string;
    };

const importCommandUsage = importCommands.join("|");

function parseCliCommand(args: string[]): CliCommand {
  const [command, inputPath, outFlag, outputPath] = args;

  if (
    !isImportCommand(command) ||
    !inputPath ||
    outFlag !== "--out" ||
    !outputPath
  ) {
    throw new Error(
      `Usage: continuum-import <${importCommandUsage}> <source-file> --out <events.jsonl>`,
    );
  }

  return { kind: "import", source: command, inputPath, outputPath };
}

function parseInspectCommand(args: string[]): CliCommand {
  const [, source, inputPath] = args;

  if (!isImportCommand(source) || !inputPath) {
    throw new Error(`Usage: continuum-import inspect <${importCommandUsage}> <source-file>`);
  }

  return { kind: "inspect", source, inputPath };
}

function parseDryRunCommand(args: string[]): CliCommand {
  const [, source, inputPath, outFlag, previewPath] = args;

  if (
    !isImportCommand(source) ||
    !inputPath ||
    outFlag !== "--out" ||
    !previewPath
  ) {
    throw new Error(
      `Usage: continuum-import dry-run <${importCommandUsage}> <source-file> --out <preview.json>`,
    );
  }

  return { kind: "dry-run", source, inputPath, previewPath };
}

function parseCommand(args: string[]): CliCommand {
  if (args[0] === "inspect") {
    return parseInspectCommand(args);
  }

  if (args[0] === "dry-run") {
    return parseDryRunCommand(args);
  }

  return parseCliCommand(args);
}

async function readExistingEvents(outputPath: string): Promise<CanonicalEvent[]> {
  try {
    const raw = await readFile(outputPath, "utf8");
    const lines = raw
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return lines.map((line) => JSON.parse(line) as CanonicalEvent);
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

export async function runContinuumImportCli(
  args: string[],
): Promise<ContinuumImportCliResult> {
  const command = parseCommand(args);
  const sourceInput = await readSourceInput(
    command.source,
    command.inputPath,
    command.kind === "inspect" ? null : command.kind === "dry-run" ? command.previewPath : command.outputPath,
  );

  if (command.kind === "inspect") {
    return inspectSource(command, sourceInput);
  }

  if (command.kind === "dry-run") {
    return dryRunImport(command, sourceInput);
  }

  const { incomingEvents, quarantine, warnings } = normalizeCommandInput(
    command.source,
    command.inputPath,
    sourceInput,
  );
  const existingEvents = await readExistingEvents(command.outputPath);
  const { events, report } = mergeCanonicalEvents(existingEvents, incomingEvents);
  const jsonl = events.map((event) => JSON.stringify(event)).join("\n");

  await writeFile(command.outputPath, `${jsonl}\n`, "utf8");

  return {
    command: "import",
    eventsWritten: report.new,
    outputPath: command.outputPath,
    report,
    quarantine,
    warnings,
  };
}

function normalizeCommandInput(
  source: ImportCommand,
  inputPath: string,
  input: SourceInput,
): NormalizedSourceInput {
  if (input.parseError !== null) {
    return {
      incomingEvents: [],
      quarantine: parseErrorToQuarantine(source, inputPath, input.parseError),
      sourceFiles: [],
      warnings: 0,
    };
  }

  if (isArchiveImportCommand(source)) {
    return normalizeArchiveFiles(input.parsed as ArchiveSourceFile[]);
  }

  if (!isSourceImportCommand(source)) {
    throw new Error(`Unsupported source command: ${source}`);
  }

  return normalizeSourceInput(source, input.parsed);
}

type SourceInput = {
  raw: string;
  parsed: unknown;
  hash: string;
  filesSeen: number;
  parseError: string | null;
};

type NormalizedSourceInput = {
  incomingEvents: CanonicalEvent[];
  quarantine: ImportErrorRecord[];
  sourceFiles: SourceFilePreview[];
  warnings: number;
};

async function readSourceInput(
  source: ImportCommand,
  inputPath: string,
  excludePath: string | null,
): Promise<SourceInput> {
  if (isArchiveImportCommand(source)) {
    const archive = await readTakeoutArchive(source, inputPath, excludePath);

    return {
      raw: "",
      parsed: archive.files,
      hash: archive.hash,
      filesSeen: archive.filesSeen,
      parseError: archive.parseError,
    };
  }

  const raw = await readFile(inputPath, "utf8");
  const modifiedAt = (await stat(inputPath)).mtime.toISOString();
  let parsed: unknown = raw;
  let parseError: string | null = null;

  if (isArchiveImportCommand(source)) {
    throw new Error(`Archive source should have been handled before direct read: ${source}`);
  }

  if (sourceInputNeedsJson(source)) {
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch (error: unknown) {
      parseError = error instanceof Error ? error.message : String(error);
      parsed = null;
    }
  }

  if (parseError === null) {
    parsed = prepareSourceInput(source, parsed, {
      inputPath,
      relativePath: basename(inputPath),
      modifiedAt,
      modifiedAtConfidence: "exact",
    });
  }

  return {
    raw,
    parsed,
    hash: createHash("sha256").update(raw).digest("hex"),
    filesSeen: 1,
    parseError,
  };
}

function parseErrorToQuarantine(
  source: ImportCommand,
  inputPath: string,
  message: string,
): ImportErrorRecord[] {
  return [
    {
      sourcePath: basename(inputPath),
      recordIndex: null,
      errorCode: "source_parse_failed",
      message: `${source}:${basename(inputPath)}: ${message}`,
      recoverable: true,
    },
  ];
}

function inspectSource(command: Extract<CliCommand, { kind: "inspect" }>, input: SourceInput): InspectCliResult {
  const { incomingEvents, quarantine, sourceFiles, warnings } = normalizeCommandInput(
    command.source,
    command.inputPath,
    input,
  );
  const conversationsSeen =
    command.source !== "google-takeout-folder" && Array.isArray(input.parsed)
      ? input.parsed.length
      : 0;

  return {
    command: "inspect",
    sourcePlatform: command.source,
    sourceName: command.source,
    inputPath: command.inputPath,
    conversationsSeen,
    recordsSeen: incomingEvents.length,
    validationErrors: quarantine.length,
    importableEvents: incomingEvents.length,
    warnings,
    sourceFiles,
  };
}

async function dryRunImport(
  command: Extract<CliCommand, { kind: "dry-run" }>,
  input: SourceInput,
): Promise<DryRunCliResult> {
  const { incomingEvents, quarantine, sourceFiles, warnings } =
    normalizeCommandInput(command.source, command.inputPath, input);
  const { report } = mergeCanonicalEvents([], incomingEvents);
  const batch = createImportBatch({
    source: command.source,
    inputPath: command.inputPath,
    inputHash: input.hash,
    filesSeen: input.filesSeen,
    recordsSeen: incomingEvents.length + quarantine.length,
    report,
    quarantine,
    warnings,
  });
  const preview: ImportPreview = {
    batch,
    report,
    quarantine,
    sourceFiles:
      sourceFiles.length > 0
        ? sourceFiles
        : sourceFilesForPreview(
            command.source,
            command.inputPath,
            incomingEvents,
            quarantine,
          ),
    events: incomingEvents.map((event) => ({
      id: event.id,
      platform: event.source.platform,
      role: event.actor.role,
      createdAt: event.time.createdAt,
      subject: event.content.subject,
    })),
  };

  await writeFile(command.previewPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");

  return {
    command: "dry-run",
    previewPath: command.previewPath,
    batch,
    report,
    quarantine,
  };
}

function sourceFilesForPreview(
  source: ImportCommand,
  inputPath: string,
  incomingEvents: CanonicalEvent[],
  quarantine: ImportErrorRecord[],
): SourceFilePreview[] {
  if (isArchiveImportCommand(source)) {
    return [];
  }

  return [
    {
      path: basename(inputPath),
      source,
      status: quarantine.length > 0 ? "invalid" : "matched",
      eventsCreated: incomingEvents.length,
      quarantineRecords: quarantine.length,
    },
  ];
}

function createImportBatch(input: {
  source: ImportCommand;
  inputPath: string;
  inputHash: string;
  filesSeen: number;
  recordsSeen: number;
  report: ImportReport;
  quarantine: ImportErrorRecord[];
  warnings: number;
}): ImportBatch {
  return {
    id: `batch:${input.inputHash.slice(0, 16)}`,
    sourcePlatform: input.source,
    sourceName: input.source,
    originalFilename: basename(input.inputPath),
    originalFileHash: input.inputHash,
    createdAt: "unknown",
    completedAt: null,
    status: "previewed",
    stats: {
      filesSeen: input.filesSeen,
      recordsSeen: input.recordsSeen,
      eventsCreated: input.report.new,
      eventsKnown: input.report.known,
      eventsChanged: input.report.changed,
      eventsUncertain: input.report.uncertain,
      recordsQuarantined: input.quarantine.length,
      warnings: input.warnings,
    },
  };
}

export function formatContinuumImportCliResult(
  result: ContinuumImportCliResult,
): string {
  if (result.command === "inspect") {
    return `Detected ${result.sourcePlatform} conversations=${result.conversationsSeen} records=${result.recordsSeen} importable=${result.importableEvents} validationErrors=${result.validationErrors} warnings=${result.warnings} sourceFiles=${result.sourceFiles.length}\n`;
  }

  if (result.command === "dry-run") {
    return [
      `Preview written to ${result.previewPath}`,
      `Report new=${result.report.new} known=${result.report.known} changed=${result.report.changed} uncertain=${result.report.uncertain} quarantined=${result.quarantine.length} warnings=${result.batch.stats.warnings} sourceFiles=${result.batch.stats.filesSeen}`,
    ].join("\n") + "\n";
  }

  return [
    `Wrote ${result.eventsWritten} new events to ${result.outputPath}`,
    `Report new=${result.report.new} known=${result.report.known} changed=${result.report.changed} uncertain=${result.report.uncertain} quarantined=${result.quarantine.length} warnings=${result.warnings}`,
  ].join("\n") + "\n";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runContinuumImportCli(process.argv.slice(2))
    .then((result) => {
      process.stdout.write(formatContinuumImportCliResult(result));
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`${message}\n`);
      process.exitCode = 1;
    });
}
