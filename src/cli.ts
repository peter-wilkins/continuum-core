#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, resolve, join } from "node:path";
import { strFromU8, unzipSync } from "fflate";

import {
  type ImportErrorRecord,
  mergeCanonicalEvents,
  normalizeClaudeConversations,
  normalizeChatGptConversations,
  normalizeGoogleChromeBookmarksExport,
  normalizeGoogleChromeHistoryExport,
  normalizeGoogleChromeReadingListExport,
  normalizeGoogleMyActivityExport,
  normalizeGitCommit,
  normalizeICalendarEvent,
  normalizeMarkdownDocument,
  parseClaudeConversationsWithQuarantine,
  parseGoogleChromeBookmarksExport,
  parseGoogleChromeHistoryExport,
  parseGoogleChromeReadingListExport,
  parseGoogleMyActivityExport,
  parseGitLog,
  parseICalendarEvents,
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

type ImportCommand =
  | "chatgpt"
  | "claude"
  | "google-chrome-history"
  | "google-chrome-bookmarks"
  | "google-chrome-reading-list"
  | "google-my-activity"
  | "git-log"
  | "icalendar"
  | "markdown"
  | "google-takeout-folder"
  | "google-takeout-zip";

const importCommands = [
  "chatgpt",
  "claude",
  "google-chrome-history",
  "google-chrome-bookmarks",
  "google-chrome-reading-list",
  "google-my-activity",
  "git-log",
  "icalendar",
  "markdown",
  "google-takeout-folder",
  "google-takeout-zip",
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

  return normalizeSourceInput(source, input.parsed);
}

type SourceInput = {
  raw: string;
  parsed: unknown;
  hash: string;
  filesSeen: number;
  parseError: string | null;
};

type TakeoutFolderFile = {
  path: string;
  relativePath: string;
  raw: string;
  hash: string;
};

type ICalendarCliInput = {
  calendarPath: string;
  raw: string;
};

type MarkdownCliInput = {
  filePath: string;
  modifiedAt: string;
  modifiedAtConfidence: "exact" | "unknown";
  raw: string;
};

type GitLogCliInput = {
  repositoryPath: string;
  raw: string;
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
  if (source === "google-takeout-folder") {
    const files = await readTakeoutFolder(inputPath, excludePath);
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
      parseError: null,
    };
  }

  if (source === "google-takeout-zip") {
    const rawBuffer = await readFile(inputPath);

    try {
      const files = readTakeoutZip(rawBuffer);

      return {
        raw: "",
        parsed: files,
        hash: createHash("sha256").update(rawBuffer).digest("hex"),
        filesSeen: files.length,
        parseError: null,
      };
    } catch (error: unknown) {
      return {
        raw: "",
        parsed: null,
        hash: createHash("sha256").update(rawBuffer).digest("hex"),
        filesSeen: 1,
        parseError: error instanceof Error ? error.message : String(error),
      };
    }
  }

  const raw = await readFile(inputPath, "utf8");
  let parsed: unknown =
    source === "icalendar"
      ? {
          calendarPath: basename(inputPath),
          raw,
        } satisfies ICalendarCliInput
      : source === "markdown"
        ? {
            filePath: basename(inputPath),
            modifiedAt: (await stat(inputPath)).mtime.toISOString(),
            modifiedAtConfidence: "exact",
            raw,
          } satisfies MarkdownCliInput
        : source === "git-log"
          ? {
              repositoryPath: basename(inputPath),
              raw,
            } satisfies GitLogCliInput
      : raw;
  let parseError: string | null = null;

  if (sourceInputNeedsJson(source)) {
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch (error: unknown) {
      parseError = error instanceof Error ? error.message : String(error);
      parsed = null;
    }
  }

  return {
    raw,
    parsed,
    hash: createHash("sha256").update(raw).digest("hex"),
    filesSeen: 1,
    parseError,
  };
}

function readTakeoutZip(raw: Uint8Array): TakeoutFolderFile[] {
  const files: TakeoutFolderFile[] = [];
  const unzipped = unzipSync(raw);

  for (const [relativePath, content] of Object.entries(unzipped)) {
    if (relativePath.endsWith("/")) {
      continue;
    }

    const decoded = strFromU8(content);

    files.push({
      path: relativePath,
      relativePath,
      raw: decoded,
      hash: createHash("sha256").update(decoded).digest("hex"),
    });
  }

  return files.sort((left, right) =>
    left.relativePath.localeCompare(right.relativePath),
  );
}

async function readTakeoutFolder(
  inputPath: string,
  excludePath: string | null,
): Promise<TakeoutFolderFile[]> {
  const files: TakeoutFolderFile[] = [];
  const excludedAbsolutePath = excludePath === null ? null : resolve(excludePath);

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

      if (excludedAbsolutePath !== null && resolve(path) === excludedAbsolutePath) {
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
    "git-log",
    "icalendar",
    "markdown",
    "google-takeout-folder",
    "google-takeout-zip",
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
    const source = classifyTakeoutFile(file);

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
      if (source === "icalendar") {
        parsed = {
          calendarPath: file.relativePath,
          raw: file.raw,
        } satisfies ICalendarCliInput;
      }
      if (source === "markdown") {
        parsed = {
          filePath: file.relativePath,
          modifiedAt: "1970-01-01T00:00:00.000Z",
          modifiedAtConfidence: "unknown",
          raw: file.raw,
        } satisfies MarkdownCliInput;
      }
      if (source === "git-log") {
        parsed = {
          repositoryPath: basename(file.relativePath),
          raw: file.raw,
        } satisfies GitLogCliInput;
      }
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

function classifyTakeoutFile(file: TakeoutFolderFile): ImportCommand | null {
  const lowerPath = file.relativePath.toLowerCase();

  if (lowerPath.endsWith(".html") && lowerPath.includes("reading")) {
    return "google-chrome-reading-list";
  }

  if (lowerPath.endsWith(".html") && lowerPath.includes("bookmark")) {
    return "google-chrome-bookmarks";
  }

  if (lowerPath.endsWith(".json") && lowerPath.includes("history")) {
    return "google-chrome-history";
  }

  if (
    lowerPath.endsWith(".json") &&
    (lowerPath.includes("myactivity") || lowerPath.includes("my activity"))
  ) {
    return "google-my-activity";
  }

  if (lowerPath.endsWith(".ics")) {
    return "icalendar";
  }

  if (lowerPath.endsWith(".md") || lowerPath.endsWith(".markdown")) {
    return "markdown";
  }

  if (lowerPath.endsWith(".gitlog") || lowerPath.endsWith(".git-log.txt")) {
    return "git-log";
  }

  if (!lowerPath.endsWith(".json")) {
    return null;
  }

  try {
    const parsed = JSON.parse(file.raw) as unknown;

    if (parseGoogleChromeHistoryExport(parsed).ok) {
      return "google-chrome-history";
    }

    if (parseGoogleMyActivityExport(parsed).ok) {
      return "google-my-activity";
    }
  } catch {
    return null;
  }

  return null;
}

function normalizeSourceInput(
  source: ImportCommand,
  parsed: unknown,
): NormalizedSourceInput {
  if (source === "google-takeout-folder" || source === "google-takeout-zip") {
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

  if (source === "icalendar") {
    const input = parsed as ICalendarCliInput;
    const result = parseICalendarEvents(input.raw);

    if (!result.ok) {
      return {
        incomingEvents: [],
        quarantine: validationErrorsToQuarantine(source, result.errors),
        sourceFiles: [],
        warnings: 0,
      };
    }

    return {
      incomingEvents: result.value.map((event) =>
        normalizeICalendarEvent({
          calendar: {
            path: input.calendarPath,
          },
          event,
        }),
      ),
      quarantine: [],
      sourceFiles: [],
      warnings: 0,
    };
  }

  if (source === "markdown") {
    const input = parsed as MarkdownCliInput;

    return {
      incomingEvents: [
        normalizeMarkdownDocument({
          file: {
            path: input.filePath,
            modifiedAt: input.modifiedAt,
            modifiedAtConfidence: input.modifiedAtConfidence,
          },
          content: input.raw,
        }),
      ],
      quarantine: [],
      sourceFiles: [],
      warnings: 0,
    };
  }

  if (source === "git-log") {
    const input = parsed as GitLogCliInput;
    const result = parseGitLog(input.raw);

    if (!result.ok) {
      return {
        incomingEvents: [],
        quarantine: validationErrorsToQuarantine(source, result.errors),
        sourceFiles: [],
        warnings: 0,
      };
    }

    return {
      incomingEvents: result.value.map((commit) =>
        normalizeGitCommit({
          repository: {
            path: input.repositoryPath,
          },
          commit,
        }),
      ),
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
