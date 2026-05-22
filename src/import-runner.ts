import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import { basename } from "node:path";

import {
  buildEmailEngagementIndex,
  createImportScope,
  evaluateCanonicalEventImportProfile,
  evaluateEmailImportProfile,
  evaluatePublicScopeEvent,
  inspectMboxFile,
  type ImportFilterDecision,
  type ImportErrorRecord,
  type ImportFilterSummary,
  type ImportProfile,
  type ImportScope,
  mergeCanonicalEvents,
  parseMboxFile,
  type CanonicalEvent,
  type EmailMessageNormalizationInput,
  type ImportReport,
  type MboxParseResult,
  summarizeImportFilterDecisions,
} from "./index";
import {
  normalizeArchiveFiles,
  readTakeoutArchive,
  type ArchiveSourceFile,
  type SourceFilePreview,
} from "./archive-intake";
import {
  isArchiveImportCommand,
  isSourceImportCommand,
  normalizeSourceInput,
  prepareSourceInput,
  sourceInputNeedsJson,
  type ImportCommand,
} from "./import-source-adapters";

export type ImportBatch = {
  id: string;
  sourcePlatform: ImportCommand;
  sourceName: string;
  originalFilename: string;
  originalFileHash: string;
  importScope: ImportScope | null;
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
  importProfile: ImportProfile;
  batch: ImportBatch;
  report: ImportReport;
  quarantine: ImportErrorRecord[];
  filterSummary: ImportFilterSummary;
  sourceFiles: SourceFilePreview[];
  events: Array<{
    id: string;
    platform: string;
    role: string;
    createdAt: string;
    subject: string | null;
    filterDecision: ImportFilterDecision;
    memoryActive: boolean;
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
  filterSummary: ImportFilterSummary;
};

export type ContinuumImportCliResult =
  | ImportWriteCliResult
  | InspectCliResult
  | DryRunCliResult;

export type ImportRunnerCommand =
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
      importScopePath: string | null;
      myAddresses: string[];
      previewPath: string;
    };

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

export async function runImportCommand(
  command: ImportRunnerCommand,
): Promise<ContinuumImportCliResult> {
  if (command.kind === "inspect" && command.source === "email-mbox") {
    return inspectEmailMboxSource(command);
  }

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

  if (source === "email-mbox") {
    const result = await parseMboxFile(inputPath, {
      mailboxPath: basename(inputPath),
    });

    return {
      raw: "",
      parsed: result,
      hash: result.hash ?? "",
      filesSeen: 1,
      parseError: null,
    };
  }

  const raw = await readFile(inputPath, "utf8");
  const modifiedAt = (await stat(inputPath)).mtime.toISOString();
  let parsed: unknown = raw;
  let parseError: string | null = null;

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

async function inspectEmailMboxSource(
  command: Extract<ImportRunnerCommand, { kind: "inspect" }>,
): Promise<InspectCliResult> {
  const result = await inspectMboxFile(command.inputPath);

  return {
    command: "inspect",
    sourcePlatform: command.source,
    sourceName: command.source,
    inputPath: command.inputPath,
    conversationsSeen: 0,
    recordsSeen: result.messagesSeen,
    validationErrors: result.quarantine.length,
    importableEvents: result.messagesParsed,
    warnings: 0,
    sourceFiles: [
      {
        path: basename(command.inputPath),
        source: command.source,
        status: result.quarantine.length > 0 ? "invalid" : "matched",
        eventsCreated: result.messagesParsed,
        quarantineRecords: result.quarantine.length,
      },
    ],
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

function inspectSource(
  command: Extract<ImportRunnerCommand, { kind: "inspect" }>,
  input: SourceInput,
): InspectCliResult {
  const { incomingEvents, quarantine, sourceFiles, warnings } =
    normalizeCommandInput(command.source, command.inputPath, input);
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
  command: Extract<ImportRunnerCommand, { kind: "dry-run" }>,
  input: SourceInput,
): Promise<DryRunCliResult> {
  const { incomingEvents, quarantine, sourceFiles, warnings } =
    normalizeCommandInput(command.source, command.inputPath, input);
  const importProfile: ImportProfile = "intentional_context";
  const importScope = await readImportScope(command.importScopePath);
  const filterDecisions = dryRunFilterDecisions(
    command,
    input,
    incomingEvents,
    importProfile,
    importScope,
  );
  const filterSummary = summarizeImportFilterDecisions(filterDecisions);
  const { report } = mergeCanonicalEvents([], incomingEvents);
  const batch = createImportBatch({
    source: command.source,
    inputPath: command.inputPath,
    inputHash: input.hash,
    importScope,
    filesSeen: input.filesSeen,
    recordsSeen: incomingEvents.length + quarantine.length,
    report,
    quarantine,
    warnings,
  });
  const preview: ImportPreview = {
    importProfile,
    batch,
    report,
    quarantine,
    filterSummary,
    sourceFiles:
      sourceFiles.length > 0
        ? sourceFiles
        : sourceFilesForPreview(
            command.source,
            command.inputPath,
            incomingEvents,
            quarantine,
          ),
    events: incomingEvents.map((event, index) => ({
      id: event.id,
      platform: event.source.platform,
      role: event.actor.role,
      createdAt: event.time.createdAt,
      subject: event.content.subject,
      filterDecision: filterDecisions[index]!,
      memoryActive: filterDecisions[index]?.action === "include",
    })),
  };

  await writeFile(command.previewPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");

  return {
    command: "dry-run",
    previewPath: command.previewPath,
    batch,
    report,
    quarantine,
    filterSummary,
  };
}

function dryRunFilterDecisions(
  command: Extract<ImportRunnerCommand, { kind: "dry-run" }>,
  input: SourceInput,
  incomingEvents: CanonicalEvent[],
  importProfile: ImportProfile,
  importScope: ImportScope | null,
): ImportFilterDecision[] {
  if (importScope !== null) {
    return incomingEvents.map((event) =>
      evaluatePublicScopeEvent(importScope, event),
    );
  }

  if (command.source !== "email-mbox") {
    return incomingEvents.map((event) =>
      evaluateCanonicalEventImportProfile({
        profile: importProfile,
        event,
      }),
    );
  }

  if (command.myAddresses.length === 0) {
    throw new Error(
      "email-mbox dry-run requires at least one --my-address value.",
    );
  }

  const messages = emailMessagesFromSourceInput(input);
  const engagement = buildEmailEngagementIndex(messages, command.myAddresses);

  return messages.map((message) =>
    evaluateEmailImportProfile({
      profile: importProfile,
      message,
      engagement,
      myAddresses: command.myAddresses,
    }),
  );
}

function emailMessagesFromSourceInput(
  input: SourceInput,
): EmailMessageNormalizationInput[] {
  const parsed = input.parsed as Partial<MboxParseResult> | null;

  if (!parsed || !Array.isArray(parsed.messages)) {
    throw new Error("email-mbox dry-run expected parsed MBOX messages.");
  }

  return parsed.messages;
}

async function readImportScope(
  importScopePath: string | null,
): Promise<ImportScope | null> {
  if (importScopePath === null) {
    return null;
  }

  return createImportScope(
    JSON.parse(await readFile(importScopePath, "utf8")) as ImportScope,
  );
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
  importScope: ImportScope | null;
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
    importScope: input.importScope,
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
