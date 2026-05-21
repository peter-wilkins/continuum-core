#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

import {
  normalizeChatGptConversations,
  type ChatGptConversationExport,
} from "./index";

export type ContinuumImportCliResult = {
  eventsWritten: number;
  outputPath: string;
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

export async function runContinuumImportCli(
  args: string[],
): Promise<ContinuumImportCliResult> {
  const { inputPath, outputPath } = parseChatGptCommand(args);
  const raw = await readFile(inputPath, "utf8");
  const conversations = JSON.parse(raw) as ChatGptConversationExport[];
  const events = normalizeChatGptConversations(conversations);
  const jsonl = events.map((event) => JSON.stringify(event)).join("\n");

  await writeFile(outputPath, `${jsonl}\n`, "utf8");

  return {
    eventsWritten: events.length,
    outputPath,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runContinuumImportCli(process.argv.slice(2))
    .then((result) => {
      process.stdout.write(
        `Wrote ${result.eventsWritten} events to ${result.outputPath}\n`,
      );
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`${message}\n`);
      process.exitCode = 1;
    });
}
