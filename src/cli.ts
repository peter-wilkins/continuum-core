#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

import {
  type ImportErrorRecord,
  mergeCanonicalEvents,
  normalizeClaudeConversations,
  normalizeChatGptConversations,
  normalizeGoogleChromeBookmarksExport,
  normalizeGoogleChromeHistoryExport,
  normalizeGoogleChromeReadingListExport,
  normalizeGoogleMyActivityExport,
  parseClaudeConversationsWithQuarantine,
  parseGoogleChromeBookmarksExport,
  parseGoogleChromeHistoryExport,
  parseGoogleChromeReadingListExport,
  parseGoogleMyActivityExport,
  type CanonicalEvent,
  type ChatGptConversationExport,
  type ImportReport,
} from "./index";

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

export type SourceFilePreview = {
  path: string;
  source: ImportCommand | null;
  status: "matched" | "skipped" | "invalid";
  eventsCreated: number;
  quarantineRecords: number;
};

export type ImportWriteCliResult = {
  command: "import";
  eventsWritten: number;
  outputPath: string;
  report: ImportReport;
  quarantine: ImportErrorRecord[];
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

type ImportCommand =
  | "chatgpt"
  | "claude"
  | "google-chrome-history"
  | "google-chrome-bookmarks"
  | "google-chrome-reading-list"
  | "google-my-activity"
  | "google-takeout-folder";

const importCommands = [
  "chatgpt",
  "claude",
  "google-chrome-history",
  "google-chrome-bookmarks",
  "google-chrome-reading-list",
  "google-my-activity",
  "google-takeout-folder",
] as const satisfies ImportCommand[];
const importCommandUsage = importCommands.join("|");

function isImportCommand(source: string | undefined): source is ImportCommand {
  return importCommands.some((command) => command === source);
}

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
  const sourceInput = await readSourceInput(command.source, command.inputPath);

  if (command.kind === "inspect") {
    return inspectSource(command, sourceInput);
  }

  if (command.kind === "dry-run") {
    return dryRunImport(command, sourceInput);
  }

  const { incomingEvents, quarantine } = normalizeSourceInput(
    command.source,
    sourceInput.parsed,
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
  };
}

type SourceInput = {
  raw: string;
  parsed: unknown;
  hash: string;
  filesSeen: number;
};

type TakeoutFolderFile = {
  path: string;
  relativePath: string;
  raw: string;
  hash: string;
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
): Promise<SourceInput> {
  if (source === "google-takeout-folder") {
    const files = await readTakeoutFolder(inputPath);
    const hash = createHash("sha256");

    for (const file of files) {
      hash.update(file.relativePath);
      hash.update(file.hash);
    }

    return {
      raw: "",
      parsed: files,
      hash: hash.digest("hex"),
      filesSeen: files.length,
    };
  }

  const raw = await readFile(inputPath, "utf8");

  return {
    raw,
    parsed: sourceInputNeedsJson(source) ? JSON.parse(raw) as unknown : raw,
    hash: createHash("sha256").update(raw).digest("hex"),
    filesSeen: 1,
  };
}

async function readTakeoutFolder(inputPath: string): Promise<TakeoutFolderFile[]> {
  const files: TakeoutFolderFile[] = [];

  async function walk(currentPath: string, relativePrefix: string): Promise<void> {
    const entries = await readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const path = join(currentPath, entry.name);
      const relativePath = relativePrefix ? join(relativePrefix, entry.name) : entry.name;

      if (entry.isDirectory()) {
        await walk(path, relativePath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const raw = await readFile(path, "utf8");

      files.push({
        path,
        relativePath,
        raw,
        hash: createHash("sha256").update(raw).digest("hex"),
      });
    }
  }

  const inputStat = await stat(inputPath);

  if (!inputStat.isDirectory()) {
    throw new Error("google-takeout-folder input must be a directory.");
  }

  await walk(inputPath, "");

  return files.sort((left, right) =>
    left.relativePath.localeCompare(right.relativePath),
  );
}

function sourceInputNeedsJson(source: ImportCommand): boolean {
  return ![
    "google-chrome-bookmarks",
    "google-chrome-reading-list",
    "google-takeout-folder",
  ].includes(source);
}

function validationErrorsToQuarantine(
  source: ImportCommand,
  errors: Array<{ path: string; message: string }>,
): ImportErrorRecord[] {
  return errors.map((error) => ({
    sourcePath: error.path,
    recordIndex: null,
    errorCode: "source_validation_failed",
    message: `${source}:${error.path}: ${error.message}`,
    recoverable: true,
  }));
}

function normalizeTakeoutFolder(files: TakeoutFolderFile[]): {
  incomingEvents: CanonicalEvent[];
  quarantine: ImportErrorRecord[];
  sourceFiles: SourceFilePreview[];
  warnings: number;
} {
  const incomingEvents: CanonicalEvent[] = [];
  const quarantine: ImportErrorRecord[] = [];
  const sourceFiles: SourceFilePreview[] = [];
  let warnings = 0;

  for (const file of files) {
    const lowerPath = file.relativePath.toLowerCase();
    const source =
      lowerPath.endsWith(".html") && lowerPath.includes("reading")
        ? "google-chrome-reading-list"
        : lowerPath.endsWith(".html") && lowerPath.includes("bookmark")
          ? "google-chrome-bookmarks"
          : lowerPath.endsWith(".json") && lowerPath.includes("history")
            ? "google-chrome-history"
            : lowerPath.endsWith(".json") &&
                (lowerPath.includes("myactivity") ||
                  lowerPath.includes("my activity"))
              ? "google-my-activity"
              : null;

    if (source === null) {
      warnings += 1;
      sourceFiles.push({
        path: file.relativePath,
        source: null,
        status: "skipped",
        eventsCreated: 0,
        quarantineRecords: 0,
      });
      continue;
    }

    let parsed: unknown;

    try {
      parsed = sourceInputNeedsJson(source) ? JSON.parse(file.raw) as unknown : file.raw;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      quarantine.push({
        sourcePath: file.relativePath,
        recordIndex: null,
        errorCode: "source_parse_failed",
        message: `google-takeout-folder:${file.relativePath}: ${message}`,
        recoverable: true,
      });
      sourceFiles.push({
        path: file.relativePath,
        source,
        status: "invalid",
        eventsCreated: 0,
        quarantineRecords: 1,
      });
      continue;
    }

    const result = normalizeSourceInput(source, parsed);
    const fileQuarantine = result.quarantine.map((record) => ({
      ...record,
      sourcePath: record.sourcePath
        ? `${file.relativePath}:${record.sourcePath}`
        : file.relativePath,
    }));

    incomingEvents.push(...result.incomingEvents);
    quarantine.push(...fileQuarantine);
    sourceFiles.push({
      path: file.relativePath,
      source,
      status: fileQuarantine.length > 0 ? "invalid" : "matched",
      eventsCreated: result.incomingEvents.length,
      quarantineRecords: fileQuarantine.length,
    });
  }

  return { incomingEvents, quarantine, sourceFiles, warnings };
}

function normalizeSourceInput(
  source: ImportCommand,
  parsed: unknown,
): NormalizedSourceInput {
  if (source === "google-takeout-folder") {
    return normalizeTakeoutFolder(parsed as TakeoutFolderFile[]);
  }

  if (source === "chatgpt") {
    return {
      incomingEvents: normalizeChatGptConversations(
        parsed as ChatGptConversationExport[],
      ),
      quarantine: [],
      sourceFiles: [],
      warnings: 0,
    };
  }

  if (source === "google-chrome-history") {
    const result = parseGoogleChromeHistoryExport(parsed);

    if (!result.ok) {
      return {
        incomingEvents: [],
        quarantine: validationErrorsToQuarantine(source, result.errors),
        sourceFiles: [],
        warnings: 0,
      };
    }

    return {
      incomingEvents: normalizeGoogleChromeHistoryExport(result.value),
      quarantine: [],
      sourceFiles: [],
      warnings: 0,
    };
  }

  if (source === "google-chrome-bookmarks") {
    const result = parseGoogleChromeBookmarksExport(String(parsed));

    if (!result.ok) {
      return {
        incomingEvents: [],
        quarantine: validationErrorsToQuarantine(source, result.errors),
        sourceFiles: [],
        warnings: 0,
      };
    }

    return {
      incomingEvents: normalizeGoogleChromeBookmarksExport(result.value),
      quarantine: [],
      sourceFiles: [],
      warnings: 0,
    };
  }

  if (source === "google-chrome-reading-list") {
    const result = parseGoogleChromeReadingListExport(String(parsed));

    if (!result.ok) {
      return {
        incomingEvents: [],
        quarantine: validationErrorsToQuarantine(source, result.errors),
        sourceFiles: [],
        warnings: 0,
      };
    }

    return {
      incomingEvents: normalizeGoogleChromeReadingListExport(result.value),
      quarantine: [],
      sourceFiles: [],
      warnings: 0,
    };
  }

  if (source === "google-my-activity") {
    const result = parseGoogleMyActivityExport(parsed);

    if (!result.ok) {
      return {
        incomingEvents: [],
        quarantine: validationErrorsToQuarantine(source, result.errors),
        sourceFiles: [],
        warnings: 0,
      };
    }

    return {
      incomingEvents: normalizeGoogleMyActivityExport(result.value),
      quarantine: [],
      sourceFiles: [],
      warnings: 0,
    };
  }

  const result = parseClaudeConversationsWithQuarantine(parsed);

  return {
    incomingEvents: normalizeClaudeConversations(result.conversations),
    quarantine: result.quarantine,
    sourceFiles: [],
    warnings: 0,
  };
}

function inspectSource(command: Extract<CliCommand, { kind: "inspect" }>, input: SourceInput): InspectCliResult {
  const { incomingEvents, quarantine, warnings } = normalizeSourceInput(
    command.source,
    input.parsed,
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
  };
}

async function dryRunImport(
  command: Extract<CliCommand, { kind: "dry-run" }>,
  input: SourceInput,
): Promise<DryRunCliResult> {
  const { incomingEvents, quarantine, sourceFiles, warnings } = normalizeSourceInput(
    command.source,
    input.parsed,
  );
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
  if (source === "google-takeout-folder") {
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

if (import.meta.url === `file://${process.argv[1]}`) {
  runContinuumImportCli(process.argv.slice(2))
    .then((result) => {
      if (result.command === "inspect") {
        process.stdout.write(
          `Detected ${result.sourcePlatform} conversations=${result.conversationsSeen} records=${result.recordsSeen} importable=${result.importableEvents} validationErrors=${result.validationErrors}\n`,
        );
        return;
      }

      if (result.command === "dry-run") {
        process.stdout.write(`Preview written to ${result.previewPath}\n`);
        process.stdout.write(
          `Report new=${result.report.new} known=${result.report.known} changed=${result.report.changed} uncertain=${result.report.uncertain} quarantined=${result.quarantine.length}\n`,
        );
        return;
      }

      process.stdout.write(`Wrote ${result.eventsWritten} new events to ${result.outputPath}\n`);
      process.stdout.write(
        `Report new=${result.report.new} known=${result.report.known} changed=${result.report.changed} uncertain=${result.report.uncertain} quarantined=${result.quarantine.length}\n`,
      );
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`${message}\n`);
      process.exitCode = 1;
    });
}
