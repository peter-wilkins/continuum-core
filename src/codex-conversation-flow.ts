import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
