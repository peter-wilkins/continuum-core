import { basename } from "node:path";

import {
  type CanonicalEvent,
  type ChatGptConversationExport,
  type ImportErrorRecord,
  normalizeChatGptConversations,
  normalizeClaudeConversations,
  normalizeGoogleChromeBookmarkRecord,
  normalizeGoogleChromeHistoryRecord,
  normalizeGoogleChromeReadingListRecord,
  normalizeGoogleContactRecord,
  normalizeGoogleMyActivityRecord,
  normalizeGitCommit,
  normalizeGitHubIssue,
  normalizeGitHubIssueComment,
  normalizeGitHubPullRequest,
  normalizeICalendarEvent,
  normalizeMarkdownDocument,
  normalizeMediaWikiRevision,
  normalizePublicDocument,
  normalizeSlackMessage,
  normalizeWikidataEntity,
  normalizeEmailMessage,
  parseClaudeConversationsWithQuarantine,
  parseGitLog,
  parseGoogleChromeBookmarksExport,
  parseGoogleChromeHistoryExport,
  parseGoogleChromeReadingListExport,
  parseGoogleContactsExport,
  parseGoogleMyActivityExport,
  parseGitHubIssues,
  parseGitHubIssueComments,
  parseGitHubPullRequests,
  parseICalendarEvents,
  parseMediaWikiRevision,
  parsePublicDocument,
  parseSlackChannelExport,
  parseWikidataEntity,
  type MboxParseResult,
} from "./index";

export type SourceImportCommand =
  | "chatgpt"
  | "claude"
  | "google-chrome-history"
  | "google-chrome-bookmarks"
  | "google-chrome-reading-list"
  | "google-contacts"
  | "google-my-activity"
  | "email-mbox"
  | "git-log"
  | "icalendar"
  | "markdown"
  | "slack"
  | "github-issues"
  | "github-issue-comments"
  | "github-pulls"
  | "mediawiki-revisions"
  | "wikidata-entity"
  | "public-document";

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

function normalizationErrorToQuarantine(
  source: ImportCommand,
  recordIndex: number,
  error: unknown,
): ImportErrorRecord {
  const message = error instanceof Error ? error.message : String(error);

  return {
    sourcePath: "",
    recordIndex,
    errorCode: "source_normalization_failed",
    message: `${source}:${recordIndex}: ${message}`,
    recoverable: true,
  };
}

function normalizeRecordsWithQuarantine<T>(
  source: ImportCommand,
  records: T[],
  normalize: (record: T) => CanonicalEvent,
): NormalizedSourceInput {
  const incomingEvents: CanonicalEvent[] = [];
  const quarantine: ImportErrorRecord[] = [];

  records.forEach((record, recordIndex) => {
    try {
      incomingEvents.push(normalize(record));
    } catch (error: unknown) {
      quarantine.push(normalizationErrorToQuarantine(source, recordIndex, error));
    }
  });

  return {
    incomingEvents,
    quarantine,
    sourceFiles: [],
    warnings: 0,
  };
}

function slackChannelNameFromPath(relativePath: string): string {
  const parts = relativePath.split(/[\\/]/).filter((part) => part.length > 0);
  const filename = parts.at(-1) ?? relativePath;

  if (/^\d{4}-\d{2}-\d{2}\.json$/i.test(filename) && parts.length >= 2) {
    return parts.at(-2) ?? "unknown";
  }

  return basename(filename, ".json");
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

      return normalizeRecordsWithQuarantine(
        "google-chrome-history",
        result.value["Browser History"],
        (history) => normalizeGoogleChromeHistoryRecord({ history }),
      );
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

      return normalizeRecordsWithQuarantine(
        "google-chrome-bookmarks",
        result.value.bookmarks,
        (bookmark) => normalizeGoogleChromeBookmarkRecord({ bookmark }),
      );
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

      return normalizeRecordsWithQuarantine(
        "google-chrome-reading-list",
        result.value.entries,
        (bookmark) => normalizeGoogleChromeReadingListRecord({ bookmark }),
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

      return normalizeRecordsWithQuarantine(
        "google-my-activity",
        result.value,
        (activity) => normalizeGoogleMyActivityRecord({ activity }),
      );
    },
  },
  {
    source: "google-contacts",
    parseMode: "text",
    fileMatches: (file) => {
      const lowerPath = file.relativePath.toLowerCase();

      return (
        lowerPath.endsWith(".vcf") &&
        (lowerPath.includes("contact") || lowerPath.includes("people"))
      );
    },
    prepareInput: (raw, context) => ({
      sourcePath: context.relativePath,
      modifiedAt: context.modifiedAt,
      modifiedAtConfidence: context.modifiedAtConfidence,
      raw: String(raw),
    }),
    normalize: (parsed) => {
      const input = parsed as {
        sourcePath: string;
        modifiedAt: string;
        modifiedAtConfidence: "exact" | "unknown";
        raw: string;
      };
      const result = parseGoogleContactsExport(input.raw);

      if (!result.ok) {
        return {
          incomingEvents: [],
          quarantine: validationErrorsToQuarantine(
            "google-contacts",
            result.errors,
          ),
          sourceFiles: [],
          warnings: 0,
        };
      }

      return normalizeRecordsWithQuarantine(
        "google-contacts",
        result.value.contacts,
        (contact) =>
          normalizeGoogleContactRecord({
            contact,
            sourcePath: input.sourcePath,
            modifiedAt: input.modifiedAt,
            modifiedAtConfidence: input.modifiedAtConfidence,
          }),
      );
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

      return normalizeRecordsWithQuarantine(
        "icalendar",
        result.value,
        (event) =>
          normalizeICalendarEvent({
            calendar: {
              path: input.calendarPath,
            },
            event,
          }),
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
    source: "slack",
    parseMode: "json",
    fileMatches: (file) => {
      const lowerPath = file.relativePath.toLowerCase();

      return lowerPath.endsWith(".json") && lowerPath.includes("slack");
    },
    prepareInput: (parsed, context) => ({
      workspaceName: "slack-export",
      channelName: slackChannelNameFromPath(context.relativePath),
      parsed,
    }),
    normalize: (parsed) => {
      const input = parsed as {
        workspaceName: string;
        channelName: string;
        parsed: unknown;
      };
      const result = parseSlackChannelExport(input.parsed, {
        channelName: input.channelName,
      });

      if (!result.ok) {
        return {
          incomingEvents: [],
          quarantine: validationErrorsToQuarantine("slack", result.errors),
          sourceFiles: [],
          warnings: 0,
        };
      }

      return normalizeRecordsWithQuarantine(
        "slack",
        result.value,
        (message) =>
          normalizeSlackMessage({
            workspace: {
              name: input.workspaceName,
            },
            channel: {
              name: input.channelName,
            },
            message,
          }),
      );
    },
  },
  {
    source: "mediawiki-revisions",
    parseMode: "json",
    fileMatches: (file) => {
      const lowerPath = file.relativePath.toLowerCase();

      return (
        lowerPath.endsWith(".json") &&
        (lowerPath.includes("wikipedia") ||
          lowerPath.includes("wikimedia") ||
          lowerPath.includes("mediawiki") ||
          lowerPath.includes("revision"))
      );
    },
    parsedMatches: (parsed) => parseMediaWikiRevision(parsed).ok,
    prepareInput: (parsed) => parsed,
    normalize: (parsed) => {
      const result = parseMediaWikiRevision(parsed);

      if (!result.ok) {
        return {
          incomingEvents: [],
          quarantine: validationErrorsToQuarantine(
            "mediawiki-revisions",
            result.errors,
          ),
          sourceFiles: [],
          warnings: 0,
        };
      }

      return emptyNormalizedInput([normalizeMediaWikiRevision(result.value)]);
    },
  },
  {
    source: "wikidata-entity",
    parseMode: "json",
    fileMatches: (file) => {
      const lowerPath = file.relativePath.toLowerCase();

      return (
        lowerPath.endsWith(".json") &&
        (lowerPath.includes("wikidata") || lowerPath.includes("entitydata"))
      );
    },
    parsedMatches: (parsed) => parseWikidataEntity(parsed).ok,
    prepareInput: (parsed) => parsed,
    normalize: (parsed) => {
      const result = parseWikidataEntity(parsed);

      if (!result.ok) {
        return {
          incomingEvents: [],
          quarantine: validationErrorsToQuarantine(
            "wikidata-entity",
            result.errors,
          ),
          sourceFiles: [],
          warnings: 0,
        };
      }

      return emptyNormalizedInput([normalizeWikidataEntity(result.value)]);
    },
  },
  {
    source: "public-document",
    parseMode: "json",
    fileMatches: (file) => {
      const lowerPath = file.relativePath.toLowerCase();

      return (
        lowerPath.endsWith(".json") &&
        (lowerPath.includes("public-document") ||
          lowerPath.includes("project-gutenberg"))
      );
    },
    parsedMatches: (parsed) => parsePublicDocument(parsed).ok,
    prepareInput: (parsed) => parsed,
    normalize: (parsed) => {
      const result = parsePublicDocument(parsed);

      if (!result.ok) {
        return {
          incomingEvents: [],
          quarantine: validationErrorsToQuarantine(
            "public-document",
            result.errors,
          ),
          sourceFiles: [],
          warnings: 0,
        };
      }

      return emptyNormalizedInput([normalizePublicDocument(result.value)]);
    },
  },
  {
    source: "github-issue-comments",
    parseMode: "json",
    fileMatches: (file) => {
      const lowerPath = file.relativePath.toLowerCase();

      return (
        lowerPath.endsWith(".json") &&
        ((lowerPath.includes("github") && lowerPath.includes("comment")) ||
          lowerPath.includes("issue-comments") ||
          lowerPath.includes("issue_comments"))
      );
    },
    parsedMatches: (parsed) => parseGitHubIssueComments(parsed).ok,
    prepareInput: (parsed) => parsed,
    normalize: (parsed) => {
      const result = parseGitHubIssueComments(parsed);

      if (!result.ok) {
        return {
          incomingEvents: [],
          quarantine: validationErrorsToQuarantine(
            "github-issue-comments",
            result.errors,
          ),
          sourceFiles: [],
          warnings: 0,
        };
      }

      return normalizeRecordsWithQuarantine(
        "github-issue-comments",
        result.value,
        (comment) => normalizeGitHubIssueComment({ comment }),
      );
    },
  },
  {
    source: "github-issues",
    parseMode: "json",
    fileMatches: (file) => {
      const lowerPath = file.relativePath.toLowerCase();

      return (
        lowerPath.endsWith(".json") &&
        !lowerPath.includes("comment") &&
        !lowerPath.includes("pull") &&
        ((lowerPath.includes("github") && lowerPath.includes("issue")) ||
          lowerPath.includes("issues.json") ||
          lowerPath.includes("issues_"))
      );
    },
    parsedMatches: (parsed) => parseGitHubIssues(parsed).ok,
    prepareInput: (parsed) => parsed,
    normalize: (parsed) => {
      const result = parseGitHubIssues(parsed);

      if (!result.ok) {
        return {
          incomingEvents: [],
          quarantine: validationErrorsToQuarantine(
            "github-issues",
            result.errors,
          ),
          sourceFiles: [],
          warnings: 0,
        };
      }

      return normalizeRecordsWithQuarantine(
        "github-issues",
        result.value,
        (issue) => normalizeGitHubIssue({ issue }),
      );
    },
  },
  {
    source: "github-pulls",
    parseMode: "json",
    fileMatches: (file) => {
      const lowerPath = file.relativePath.toLowerCase();

      return (
        lowerPath.endsWith(".json") &&
        ((lowerPath.includes("github") && lowerPath.includes("pull")) ||
          lowerPath.includes("pulls.json") ||
          lowerPath.includes("pull-requests") ||
          lowerPath.includes("pull_requests"))
      );
    },
    parsedMatches: (parsed) => parseGitHubPullRequests(parsed).ok,
    prepareInput: (parsed) => parsed,
    normalize: (parsed) => {
      const result = parseGitHubPullRequests(parsed);

      if (!result.ok) {
        return {
          incomingEvents: [],
          quarantine: validationErrorsToQuarantine(
            "github-pulls",
            result.errors,
          ),
          sourceFiles: [],
          warnings: 0,
        };
      }

      return normalizeRecordsWithQuarantine(
        "github-pulls",
        result.value,
        (pullRequest) => normalizeGitHubPullRequest({ pullRequest }),
      );
    },
  },
  {
    source: "email-mbox",
    parseMode: "text",
    fileMatches: (file) => file.relativePath.toLowerCase().endsWith(".mbox"),
    prepareInput: (parsed) => parsed,
    normalize: (parsed) => {
      const result = parsed as MboxParseResult;
      const normalized = normalizeRecordsWithQuarantine(
        "email-mbox",
        result.messages,
        normalizeEmailMessage,
      );

      return {
        ...normalized,
        quarantine: [...result.quarantine, ...normalized.quarantine],
      };
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
