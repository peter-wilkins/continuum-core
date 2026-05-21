#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

import {
  mergeCanonicalEvents,
  normalizeChatGptConversations,
  type CanonicalEvent,
  type ChatGptConversationExport,
  type ImportReport,
} from "./index";

export type ContinuumImportCliResult = {
  eventsWritten: number;
  outputPath: string;
  report: ImportReport;
};

function parseChatGptCommand(args: string[]): {
  inputPath: string;
  outputPath: string;
} {
  const [command, inputPath, outFlag, outputPath] = args;

  if (command !== "chatgpt" || !inputPath || outFlag !== "--out" || !outputPath) {
    throw new Error(
      "Usage: continuum-import chatgpt <conversations.json> --out <events.jsonl>",
    );
  }

  return { inputPath, outputPath };
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
  const { inputPath, outputPath } = parseChatGptCommand(args);
  const raw = await readFile(inputPath, "utf8");
  const conversations = JSON.parse(raw) as ChatGptConversationExport[];
  const incomingEvents = normalizeChatGptConversations(conversations);
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
