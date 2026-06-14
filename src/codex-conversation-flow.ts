import { createReadStream } from "node:fs";
import { appendFile, mkdir, opendir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { createInterface } from "node:readline";

export type CodexConversationFlowCommand = {
  inputPath: string;
  outputPath: string;
  sourceLabel: string;
  maxMessageBytes: number;
};

export type CodexConversationFlowStats = {
  sourcePath: string;
  outputPath: string;
  parsedLineCount: number;
  malformedLineCount: number;
  keptMessageCount: number;
  skippedRecordCount: number;
  truncatedMessageCount: number;
  outputBytes: number;
};

export type CodexConversationFlowBatchCommand = {
  rootPath: string;
  outputDirectory: string;
  manifestPath: string;
  limit: number;
  minimumSourceBytes: number;
  minimumAgeSeconds: number;
  maxMessageBytes: number;
  deleteRawAfterProjection: boolean;
  skipManifestRecordedSources: boolean;
  generatedAt: string;
};

export type CodexConversationFlowBatchRecord = {
  sourcePath: string;
  sourceRelativePath: string;
  sourceBytes: number;
  sourceModifiedAt: string;
  outputPath: string;
  outputBytes: number;
  keptMessageCount: number;
  skippedRecordCount: number;
  malformedLineCount: number;
  truncatedMessageCount: number;
  deletedRawBlob: boolean;
  skippedDeletionReason: string | null;
};

export type CodexConversationFlowBatchResult = {
  generatedAt: string;
  rootPath: string;
  outputDirectory: string;
  manifestPath: string;
  processedCount: number;
  deletedCount: number;
  sourceBytesProcessed: number;
  sourceBytesDeleted: number;
  outputBytesWritten: number;
  records: CodexConversationFlowBatchRecord[];
};

type ConversationMessage = {
  speaker: "Peter" | "Agent";
  text: string;
};

export async function writeCodexConversationFlow(
  command: CodexConversationFlowCommand,
): Promise<CodexConversationFlowStats> {
  const inputPath = resolve(command.inputPath);
  const outputPath = resolve(command.outputPath);
  const result = await extractCodexConversationFlow(command);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, result.text, "utf8");

  return {
    sourcePath: inputPath,
    outputPath,
    parsedLineCount: result.stats.parsedLineCount,
    malformedLineCount: result.stats.malformedLineCount,
    keptMessageCount: result.stats.keptMessageCount,
    skippedRecordCount: result.stats.skippedRecordCount,
    truncatedMessageCount: result.stats.truncatedMessageCount,
    outputBytes: Buffer.byteLength(result.text, "utf8"),
  };
}

export async function runCodexConversationFlowBatch(
  command: CodexConversationFlowBatchCommand,
): Promise<CodexConversationFlowBatchResult> {
  if (command.limit < 1) {
    throw new Error("limit must be at least 1");
  }

  if (command.minimumSourceBytes < 0) {
    throw new Error("minimumSourceBytes must be zero or greater");
  }

  if (command.minimumAgeSeconds < 0) {
    throw new Error("minimumAgeSeconds must be zero or greater");
  }

  const rootPath = resolve(command.rootPath);
  const outputDirectory = resolve(command.outputDirectory);
  const manifestPath = resolve(command.manifestPath);
  await mkdir(outputDirectory, { recursive: true });
  await mkdir(dirname(manifestPath), { recursive: true });
  const recordedSources = command.skipManifestRecordedSources
    ? await readManifestRecordedSources(manifestPath)
    : new Set<string>();
  const minimumModifiedAtMs = Date.now() - command.minimumAgeSeconds * 1000;
  const sources = (await discoverConversationFlowSources(rootPath))
    .filter((source) => source.sourceBytes >= command.minimumSourceBytes)
    .filter((source) => source.sourceModifiedAtMs <= minimumModifiedAtMs)
    .filter(
      (source) =>
        !recordedSources.has(source.sourcePath) &&
        !recordedSources.has(source.sourceRelativePath),
    )
    .sort((left, right) => right.sourceBytes - left.sourceBytes || left.sourcePath.localeCompare(right.sourcePath))
    .slice(0, command.limit);
  const records: CodexConversationFlowBatchRecord[] = [];

  for (const source of sources) {
    const outputPath = join(outputDirectory, `${sourceDigestLabel(source.sourcePath)}.conversation-flow.txt`);
    const stats = await writeCodexConversationFlow({
      inputPath: source.sourcePath,
      outputPath,
      sourceLabel: source.sourceRelativePath,
      maxMessageBytes: command.maxMessageBytes,
    });
    let deletedRawBlob = false;
    let skippedDeletionReason: string | null = null;

    if (!command.deleteRawAfterProjection) {
      skippedDeletionReason = "deleteRawAfterProjection=false";
    } else if (stats.keptMessageCount < 1) {
      skippedDeletionReason = "projection-kept-no-messages";
    } else if (stats.outputBytes < 1) {
      skippedDeletionReason = "projection-output-empty";
    } else {
      await unlink(source.sourcePath);
      deletedRawBlob = true;
    }

    const record: CodexConversationFlowBatchRecord = {
      sourcePath: source.sourcePath,
      sourceRelativePath: source.sourceRelativePath,
      sourceBytes: source.sourceBytes,
      sourceModifiedAt: new Date(source.sourceModifiedAtMs).toISOString(),
      outputPath,
      outputBytes: stats.outputBytes,
      keptMessageCount: stats.keptMessageCount,
      skippedRecordCount: stats.skippedRecordCount,
      malformedLineCount: stats.malformedLineCount,
      truncatedMessageCount: stats.truncatedMessageCount,
      deletedRawBlob,
      skippedDeletionReason,
    };
    records.push(record);
    await appendFile(manifestPath, `${JSON.stringify({ generatedAt: command.generatedAt, ...record })}\n`, "utf8");
  }

  return {
    generatedAt: command.generatedAt,
    rootPath,
    outputDirectory,
    manifestPath,
    processedCount: records.length,
    deletedCount: records.filter((record) => record.deletedRawBlob).length,
    sourceBytesProcessed: records.reduce((sum, record) => sum + record.sourceBytes, 0),
    sourceBytesDeleted: records
      .filter((record) => record.deletedRawBlob)
      .reduce((sum, record) => sum + record.sourceBytes, 0),
    outputBytesWritten: records.reduce((sum, record) => sum + record.outputBytes, 0),
    records,
  };
}

export async function extractCodexConversationFlow(command: CodexConversationFlowCommand): Promise<{
  text: string;
  stats: Omit<CodexConversationFlowStats, "sourcePath" | "outputPath" | "outputBytes">;
}> {
  if (command.maxMessageBytes < 1) {
    throw new Error("maxMessageBytes must be at least 1");
  }

  const inputPath = resolve(command.inputPath);
  const messages: ConversationMessage[] = [];
  let parsedLineCount = 0;
  let malformedLineCount = 0;
  let skippedRecordCount = 0;
  let truncatedMessageCount = 0;
  const lines = createInterface({
    input: createReadStream(inputPath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  for await (const line of lines) {
    if (line.trim().length === 0) {
      continue;
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(line);
      parsedLineCount += 1;
    } catch {
      malformedLineCount += 1;
      continue;
    }

    const message = parseCodexConversationMessage(parsed, command.maxMessageBytes);

    if (message === null) {
      skippedRecordCount += 1;
      continue;
    }

    if (message.truncated) {
      truncatedMessageCount += 1;
    }

    messages.push({
      speaker: message.speaker,
      text: message.text,
    });
  }

  return {
    text: renderConversationFlow(command.sourceLabel, messages),
    stats: {
      parsedLineCount,
      malformedLineCount,
      keptMessageCount: messages.length,
      skippedRecordCount,
      truncatedMessageCount,
    },
  };
}

function parseCodexConversationMessage(
  value: unknown,
  maxMessageBytes: number,
): { speaker: "Peter" | "Agent"; text: string; truncated: boolean } | null {
  if (!isRecord(value)) {
    return null;
  }

  if (value.type !== "response_item" || !isRecord(value.payload)) {
    return null;
  }

  if (value.payload.type !== "message") {
    return null;
  }

  const role = value.payload.role;

  if (role !== "user" && role !== "assistant") {
    return null;
  }

  if (!Array.isArray(value.payload.content)) {
    return null;
  }

  const contentText = value.payload.content
    .map((item) => readConversationContentText(item, role))
    .filter((text) => text !== null)
    .join("\n\n")
    .trim();

  if (contentText.length === 0) {
    return null;
  }

  const clipped = clipUtf8(contentText, maxMessageBytes);

  return {
    speaker: role === "user" ? "Peter" : "Agent",
    text: clipped.text,
    truncated: clipped.truncated,
  };
}

function readConversationContentText(item: unknown, role: "user" | "assistant"): string | null {
  if (!isRecord(item) || typeof item.text !== "string") {
    return null;
  }

  if (role === "user" && item.type !== "input_text") {
    return null;
  }

  if (role === "assistant" && item.type !== "output_text") {
    return null;
  }

  if (isCodexInjectedContext(item.text)) {
    return null;
  }

  return item.text;
}

function isCodexInjectedContext(text: string): boolean {
  const trimmed = text.trimStart();

  return (
    trimmed.startsWith("# AGENTS.md instructions") ||
    trimmed.startsWith("<environment_context>") ||
    trimmed.includes("<environment_context>") ||
    trimmed.includes("<developer_context>")
  );
}

function clipUtf8(text: string, maxBytes: number): { text: string; truncated: boolean } {
  const bytes = Buffer.byteLength(text, "utf8");

  if (bytes <= maxBytes) {
    return { text, truncated: false };
  }

  let clipped = "";
  let clippedBytes = 0;

  for (const character of text) {
    const characterBytes = Buffer.byteLength(character, "utf8");

    if (clippedBytes + characterBytes > maxBytes) {
      break;
    }

    clipped += character;
    clippedBytes += characterBytes;
  }

  return {
    text: `${clipped}\n[truncated]`,
    truncated: true,
  };
}

function renderConversationFlow(sourceLabel: string, messages: ConversationMessage[]): string {
  const blocks = [
    `Source: ${sourceLabel}`,
    ...messages.map((message) => `${message.speaker}:\n${message.text}`),
  ];

  return `${blocks.join("\n\n")}\n`;
}

async function discoverConversationFlowSources(rootPath: string): Promise<Array<{
  sourcePath: string;
  sourceRelativePath: string;
  sourceBytes: number;
  sourceModifiedAtMs: number;
}>> {
  const sources: Array<{
    sourcePath: string;
    sourceRelativePath: string;
    sourceBytes: number;
    sourceModifiedAtMs: number;
  }> = [];

  async function walk(directory: string): Promise<void> {
    const entries = await opendir(directory);

    for await (const entry of entries) {
      const entryPath = join(directory, entry.name);

      if (entry.isDirectory()) {
        await walk(entryPath);
        continue;
      }

      if (!entry.isFile() || !entry.name.endsWith(".jsonl")) {
        continue;
      }

      const fileStat = await stat(entryPath);
      sources.push({
        sourcePath: entryPath,
        sourceRelativePath: relative(rootPath, entryPath).split(sep).join("/"),
        sourceBytes: fileStat.size,
        sourceModifiedAtMs: fileStat.mtimeMs,
      });
    }
  }

  await walk(rootPath);
  return sources;
}

async function readManifestRecordedSources(manifestPath: string): Promise<Set<string>> {
  try {
    const text = await readFile(manifestPath, "utf8");
    const sources = new Set<string>();

    for (const line of text.split(/\r?\n/)) {
      if (line.trim().length === 0) {
        continue;
      }

      try {
        const parsed = JSON.parse(line) as unknown;

        if (!isRecord(parsed)) {
          continue;
        }

        if (typeof parsed.sourcePath === "string") {
          sources.add(parsed.sourcePath);
        }

        if (typeof parsed.sourceRelativePath === "string") {
          sources.add(parsed.sourceRelativePath);
        }
      } catch {
        continue;
      }
    }

    return sources;
  } catch (error: unknown) {
    if (isRecord(error) && error.code === "ENOENT") {
      return new Set<string>();
    }

    throw error;
  }
}

function sourceDigestLabel(path: string): string {
  const name = basename(path);
  return name.endsWith(".jsonl") ? name.slice(0, -".jsonl".length) : name;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
