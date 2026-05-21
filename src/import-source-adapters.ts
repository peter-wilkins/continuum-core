import { basename } from "node:path";

import {
  type CanonicalEvent,
  type ChatGptConversationExport,
  type ImportErrorRecord,
  normalizeChatGptConversations,
  normalizeClaudeConversations,
  normalizeGoogleChromeBookmarksExport,
  normalizeGoogleChromeHistoryExport,
  normalizeGoogleChromeReadingListExport,
  normalizeGoogleMyActivityExport,
  normalizeGitCommit,
  normalizeICalendarEvent,
  normalizeMarkdownDocument,
  parseClaudeConversationsWithQuarantine,
  parseGitLog,
  parseGoogleChromeBookmarksExport,
  parseGoogleChromeHistoryExport,
  parseGoogleChromeReadingListExport,
  parseGoogleMyActivityExport,
  parseICalendarEvents,
} from "./index";

export type SourceImportCommand =
  | "chatgpt"
  | "claude"
  | "google-chrome-history"
  | "google-chrome-bookmarks"
  | "google-chrome-reading-list"
  | "google-my-activity"
  | "git-log"
  | "icalendar"
  | "markdown";

export type ArchiveImportCommand = "google-takeout-folder" | "google-takeout-zip";

export type ImportCommand = SourceImportCommand | ArchiveImportCommand;

export type SourceFileForClassification = {
  relativePath: string;
  raw: string;
};

export type SourceFileReadContext = {
  inputPath: string;
  relativePath: string;
  modifiedAt: string;
  modifiedAtConfidence: "exact" | "unknown";
};

export type NormalizedSourceInput = {
  incomingEvents: CanonicalEvent[];
  quarantine: ImportErrorRecord[];
  sourceFiles: [];
  warnings: 0;
};

type SourceAdapter = {
  source: SourceImportCommand;
  parseMode: "json" | "text";
  fileMatches: (file: SourceFileForClassification) => boolean;
  parsedMatches?: (parsed: unknown) => boolean;
  prepareInput: (rawOrParsed: unknown, context: SourceFileReadContext) => unknown;
  normalize: (input: unknown) => NormalizedSourceInput;
};

function emptyNormalizedInput(
  incomingEvents: CanonicalEvent[],
): NormalizedSourceInput {
  return {
    incomingEvents,
    quarantine: [],
    sourceFiles: [],
    warnings: 0,
  };
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

const sourceAdapters: SourceAdapter[] = [
  {
    source: "chatgpt",
    parseMode: "json",
    fileMatches: () => false,
    prepareInput: (parsed) => parsed,
    normalize: (parsed) =>
      emptyNormalizedInput(
        normalizeChatGptConversations(parsed as ChatGptConversationExport[]),
      ),
  },
  {
    source: "claude",
    parseMode: "json",
    fileMatches: () => false,
    prepareInput: (parsed) => parsed,
    normalize: (parsed) => {
      const result = parseClaudeConversationsWithQuarantine(parsed);

      return {
        incomingEvents: normalizeClaudeConversations(result.conversations),
        quarantine: result.quarantine,
        sourceFiles: [],
        warnings: 0,
      };
    },
  },
  {
    source: "google-chrome-history",
    parseMode: "json",
    fileMatches: (file) =>
      file.relativePath.toLowerCase().endsWith(".json") &&
      file.relativePath.toLowerCase().includes("history"),
    parsedMatches: (parsed) => parseGoogleChromeHistoryExport(parsed).ok,
    prepareInput: (parsed) => parsed,
    normalize: (parsed) => {
      const result = parseGoogleChromeHistoryExport(parsed);

      if (!result.ok) {
        return {
          incomingEvents: [],
          quarantine: validationErrorsToQuarantine(
            "google-chrome-history",
            result.errors,
          ),
          sourceFiles: [],
          warnings: 0,
        };
      }

      return emptyNormalizedInput(normalizeGoogleChromeHistoryExport(result.value));
    },
  },
  {
    source: "google-chrome-bookmarks",
    parseMode: "text",
    fileMatches: (file) => {
      const lowerPath = file.relativePath.toLowerCase();

      return lowerPath.endsWith(".html") && lowerPath.includes("bookmark");
    },
    prepareInput: (raw) => String(raw),
    normalize: (input) => {
      const result = parseGoogleChromeBookmarksExport(String(input));

      if (!result.ok) {
        return {
          incomingEvents: [],
          quarantine: validationErrorsToQuarantine(
            "google-chrome-bookmarks",
            result.errors,
          ),
          sourceFiles: [],
          warnings: 0,
        };
      }

      return emptyNormalizedInput(normalizeGoogleChromeBookmarksExport(result.value));
    },
  },
  {
    source: "google-chrome-reading-list",
    parseMode: "text",
    fileMatches: (file) => {
      const lowerPath = file.relativePath.toLowerCase();

      return lowerPath.endsWith(".html") && lowerPath.includes("reading");
    },
    prepareInput: (raw) => String(raw),
    normalize: (input) => {
      const result = parseGoogleChromeReadingListExport(String(input));

      if (!result.ok) {
        return {
          incomingEvents: [],
          quarantine: validationErrorsToQuarantine(
            "google-chrome-reading-list",
            result.errors,
          ),
          sourceFiles: [],
          warnings: 0,
        };
      }

      return emptyNormalizedInput(
        normalizeGoogleChromeReadingListExport(result.value),
      );
    },
  },
  {
    source: "google-my-activity",
    parseMode: "json",
    fileMatches: (file) => {
      const lowerPath = file.relativePath.toLowerCase();

      return (
        lowerPath.endsWith(".json") &&
        (lowerPath.includes("myactivity") || lowerPath.includes("my activity"))
      );
    },
    parsedMatches: (parsed) => parseGoogleMyActivityExport(parsed).ok,
    prepareInput: (parsed) => parsed,
    normalize: (parsed) => {
      const result = parseGoogleMyActivityExport(parsed);

      if (!result.ok) {
        return {
          incomingEvents: [],
          quarantine: validationErrorsToQuarantine(
            "google-my-activity",
            result.errors,
          ),
          sourceFiles: [],
          warnings: 0,
        };
      }

      return emptyNormalizedInput(normalizeGoogleMyActivityExport(result.value));
    },
  },
  {
    source: "icalendar",
    parseMode: "text",
    fileMatches: (file) => file.relativePath.toLowerCase().endsWith(".ics"),
    prepareInput: (raw, context) => ({
      calendarPath: context.relativePath,
      raw: String(raw),
    }),
    normalize: (parsed) => {
      const input = parsed as { calendarPath: string; raw: string };
      const result = parseICalendarEvents(input.raw);

      if (!result.ok) {
        return {
          incomingEvents: [],
          quarantine: validationErrorsToQuarantine("icalendar", result.errors),
          sourceFiles: [],
          warnings: 0,
        };
      }

      return emptyNormalizedInput(
        result.value.map((event) =>
          normalizeICalendarEvent({
            calendar: {
              path: input.calendarPath,
            },
            event,
          }),
        ),
      );
    },
  },
  {
    source: "markdown",
    parseMode: "text",
    fileMatches: (file) => {
      const lowerPath = file.relativePath.toLowerCase();

      return lowerPath.endsWith(".md") || lowerPath.endsWith(".markdown");
    },
    prepareInput: (raw, context) => ({
      filePath: context.relativePath,
      modifiedAt: context.modifiedAt,
      modifiedAtConfidence: context.modifiedAtConfidence,
      raw: String(raw),
    }),
    normalize: (parsed) => {
      const input = parsed as {
        filePath: string;
        modifiedAt: string;
        modifiedAtConfidence: "exact" | "unknown";
        raw: string;
      };

      return emptyNormalizedInput([
        normalizeMarkdownDocument({
          file: {
            path: input.filePath,
            modifiedAt: input.modifiedAt,
            modifiedAtConfidence: input.modifiedAtConfidence,
          },
          content: input.raw,
        }),
      ]);
    },
  },
  {
    source: "git-log",
    parseMode: "text",
    fileMatches: (file) => {
      const lowerPath = file.relativePath.toLowerCase();

      return lowerPath.endsWith(".gitlog") || lowerPath.endsWith(".git-log.txt");
    },
    prepareInput: (raw, context) => ({
      repositoryPath: basename(context.relativePath),
      raw: String(raw),
    }),
    normalize: (parsed) => {
      const input = parsed as { repositoryPath: string; raw: string };
      const result = parseGitLog(input.raw);

      if (!result.ok) {
        return {
          incomingEvents: [],
          quarantine: validationErrorsToQuarantine("git-log", result.errors),
          sourceFiles: [],
          warnings: 0,
        };
      }

      return emptyNormalizedInput(
        result.value.map((commit) =>
          normalizeGitCommit({
            repository: {
              path: input.repositoryPath,
            },
            commit,
          }),
        ),
      );
    },
  },
];

export const sourceImportCommands = sourceAdapters.map(
  (adapter) => adapter.source,
) as SourceImportCommand[];

export const importCommands = [
  ...sourceImportCommands,
  "google-takeout-folder",
  "google-takeout-zip",
] as const satisfies ImportCommand[];

export function isImportCommand(
  source: string | undefined,
): source is ImportCommand {
  return importCommands.some((command) => command === source);
}

export function isArchiveImportCommand(
  source: ImportCommand,
): source is ArchiveImportCommand {
  return source === "google-takeout-folder" || source === "google-takeout-zip";
}

export function isSourceImportCommand(
  source: ImportCommand,
): source is SourceImportCommand {
  return !isArchiveImportCommand(source);
}

function sourceAdapterFor(source: SourceImportCommand): SourceAdapter {
  const adapter = sourceAdapters.find((candidate) => candidate.source === source);

  if (!adapter) {
    throw new Error(`Unknown source adapter: ${source}`);
  }

  return adapter;
}

export function sourceInputNeedsJson(source: SourceImportCommand): boolean {
  return sourceAdapterFor(source).parseMode === "json";
}

export function prepareSourceInput(
  source: SourceImportCommand,
  rawOrParsed: unknown,
  context: SourceFileReadContext,
): unknown {
  return sourceAdapterFor(source).prepareInput(rawOrParsed, context);
}

export function normalizeSourceInput(
  source: SourceImportCommand,
  parsed: unknown,
): NormalizedSourceInput {
  return sourceAdapterFor(source).normalize(parsed);
}

export function classifySourceFile(
  file: SourceFileForClassification,
): SourceImportCommand | null {
  const filenameMatch = sourceAdapters.find((adapter) => adapter.fileMatches(file));

  if (filenameMatch) {
    return filenameMatch.source;
  }

  if (!file.relativePath.toLowerCase().endsWith(".json")) {
    return null;
  }

  try {
    const parsed = JSON.parse(file.raw) as unknown;
    const schemaMatch = sourceAdapters.find((adapter) =>
      adapter.parsedMatches?.(parsed),
    );

    return schemaMatch?.source ?? null;
  } catch {
    return null;
  }
}
