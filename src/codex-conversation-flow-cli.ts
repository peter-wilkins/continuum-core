#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  writeCodexConversationFlow,
  type CodexConversationFlowCommand,
} from "./codex-conversation-flow";

type ParsedCli = {
  inputPath: string;
  outputDirectory: string;
  maxMessageBytes: number;
};

function parseCli(args: string[]): ParsedCli {
  const [inputPath, ...flags] = args;

  if (!inputPath) {
    throw new Error(
      "Usage: continuum-codex-conversation-flow <session-jsonl> [--out local/reports/codex-conversation-flow-review] [--max-message-bytes 12000]",
    );
  }

  const parsed: ParsedCli = {
    inputPath,
    outputDirectory: "local/reports/codex-conversation-flow-review/latest",
    maxMessageBytes: 12000,
  };

  for (let index = 0; index < flags.length; index += 2) {
    const flag = flags[index];
    const value = flags[index + 1];

    if (!flag || !value) {
      throw new Error("Flags must be supplied as --name value pairs.");
    }

    if (flag === "--out") {
      parsed.outputDirectory = value;
      continue;
    }

    if (flag === "--max-message-bytes") {
      parsed.maxMessageBytes = parsePositiveInteger(value, flag);
      continue;
    }

    throw new Error(`Unknown flag: ${flag}`);
  }

  return parsed;
}

export async function runCodexConversationFlowCli(args: string[]): Promise<{
  outputPath: string;
  summaryPath: string;
  keptMessageCount: number;
  outputBytes: number;
}> {
  const parsed = parseCli(args);
  const outputPath = join(parsed.outputDirectory, "conversation-flow.txt");
  const command: CodexConversationFlowCommand = {
    inputPath: parsed.inputPath,
    outputPath,
    sourceLabel: parsed.inputPath,
    maxMessageBytes: parsed.maxMessageBytes,
  };
  const stats = await writeCodexConversationFlow(command);
  const summaryPath = join(parsed.outputDirectory, "summary.json");
  await writeFile(summaryPath, `${JSON.stringify(stats, null, 2)}\n`, "utf8");

  return {
    outputPath,
    summaryPath,
    keptMessageCount: stats.keptMessageCount,
    outputBytes: stats.outputBytes,
  };
}

function parsePositiveInteger(value: string, flag: string): number {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`${flag} must be a positive integer`);
  }

  return parsed;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCodexConversationFlowCli(process.argv.slice(2))
    .then((result) => {
      process.stdout.write(
        `Wrote conversation flow: ${result.outputPath}\nSummary: ${result.summaryPath}\nMessages: ${result.keptMessageCount}\nBytes: ${result.outputBytes}\n`,
      );
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`${message}\n`);
      process.exitCode = 1;
    });
}
