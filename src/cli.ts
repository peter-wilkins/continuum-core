#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

import {
  mergeCanonicalEvents,
  normalizeClaudeConversations,
  normalizeChatGptConversations,
  parseClaudeConversations,
  type CanonicalEvent,
  type ChatGptConversationExport,
  type ImportReport,
} from "./index";

export type ContinuumImportCliResult = {
  eventsWritten: number;
  outputPath: string;
  report: ImportReport;
};

type ImportCommand = "chatgpt" | "claude";

function parseImportCommand(args: string[]): {
  command: ImportCommand;
  inputPath: string;
  outputPath: string;
} {
  const [command, inputPath, outFlag, outputPath] = args;

  if (
    (command !== "chatgpt" && command !== "claude") ||
    !inputPath ||
    outFlag !== "--out" ||
    !outputPath
  ) {
    throw new Error(
      "Usage: continuum-import <chatgpt|claude> <conversations.json> --out <events.jsonl>",
    );
  }

  return { command, inputPath, outputPath };
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
  const { command, inputPath, outputPath } = parseImportCommand(args);
  const raw = await readFile(inputPath, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  const incomingEvents =
    command === "chatgpt"
      ? normalizeChatGptConversations(parsed as ChatGptConversationExport[])
      : normalizeClaudeConversations(parseClaudeConversationsOrThrow(parsed));
  const existingEvents = await readExistingEvents(outputPath);
  const { events, report } = mergeCanonicalEvents(existingEvents, incomingEvents);
  const jsonl = events.map((event) => JSON.stringify(event)).join("\n");

  await writeFile(outputPath, `${jsonl}\n`, "utf8");

  return {
    eventsWritten: report.new,
    outputPath,
    report,
  };
}

function parseClaudeConversationsOrThrow(parsed: unknown) {
  const result = parseClaudeConversations(parsed);

  if (result.ok) {
    return result.value;
  }

  throw new Error(
    `Claude export validation failed: ${result.errors
      .map((error) => `${error.path}: ${error.message}`)
      .join("; ")}`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runContinuumImportCli(process.argv.slice(2))
    .then((result) => {
      process.stdout.write(
        `Wrote ${result.eventsWritten} new events to ${result.outputPath}\n`,
      );
      process.stdout.write(
        `Report new=${result.report.new} known=${result.report.known} changed=${result.report.changed} uncertain=${result.report.uncertain}\n`,
      );
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`${message}\n`);
      process.exitCode = 1;
    });
}
