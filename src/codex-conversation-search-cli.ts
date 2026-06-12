#!/usr/bin/env node

import {
  indexCodexConversationFlow,
  searchCodexConversationFlow,
  type CodexConversationSearchIndexCommand,
} from "./codex-conversation-search";

type ParsedCli =
  | {
      mode: "index";
      inputDirectory: string;
      databasePath: string;
      reset: boolean;
    }
  | {
      mode: "search";
      databasePath: string;
      query: string;
      limit: number;
    };

function parseCli(args: string[]): ParsedCli {
  const [mode, ...rest] = args;

  if (mode === "index") {
    return parseIndexCli(rest);
  }

  if (mode === "search") {
    return parseSearchCli(rest);
  }

  throw new Error(
    "Usage: continuum-codex-conversation-search <index|search> ...",
  );
}

function parseIndexCli(args: string[]): ParsedCli {
  const [inputDirectory, ...flags] = args;

  if (!inputDirectory) {
    throw new Error(
      "Usage: continuum-codex-conversation-search index <conversation-flow-dir> [--db local/codex-session-conversations/search.sqlite] [--reset]",
    );
  }

  const parsed = {
    mode: "index" as const,
    inputDirectory,
    databasePath: "local/codex-session-conversations/search.sqlite",
    reset: false,
  };

  for (let index = 0; index < flags.length; index += 1) {
    const flag = flags[index];

    if (flag === "--reset") {
      parsed.reset = true;
      continue;
    }

    const value = flags[index + 1];

    if (!flag || !value) {
      throw new Error(`${flag ?? "Flag"} needs a value.`);
    }

    index += 1;

    if (flag === "--db") {
      parsed.databasePath = value;
      continue;
    }

    throw new Error(`Unknown flag: ${flag}`);
  }

  return parsed;
}

function parseSearchCli(args: string[]): ParsedCli {
  const [query, ...flags] = args;

  if (!query) {
    throw new Error(
      "Usage: continuum-codex-conversation-search search <query> [--db local/codex-session-conversations/search.sqlite] [--limit 10]",
    );
  }

  const parsed = {
    mode: "search" as const,
    databasePath: "local/codex-session-conversations/search.sqlite",
    query,
    limit: 10,
  };

  for (let index = 0; index < flags.length; index += 2) {
    const flag = flags[index];
    const value = flags[index + 1];

    if (!flag || !value) {
      throw new Error("Flags must be supplied as --name value pairs.");
    }

    if (flag === "--db") {
      parsed.databasePath = value;
      continue;
    }

    if (flag === "--limit") {
      parsed.limit = parsePositiveInteger(value, flag);
      continue;
    }

    throw new Error(`Unknown flag: ${flag}`);
  }

  return parsed;
}

export async function runCodexConversationSearchCli(args: string[]): Promise<string> {
  const parsed = parseCli(args);

  if (parsed.mode === "index") {
    const command: CodexConversationSearchIndexCommand = {
      inputDirectory: parsed.inputDirectory,
      databasePath: parsed.databasePath,
      generatedAt: new Date().toISOString(),
      reset: parsed.reset,
    };
    const result = await indexCodexConversationFlow(command);
    return [
      `Indexed files: ${result.indexedFileCount}`,
      `Indexed messages: ${result.indexedMessageCount}`,
      `Database: ${result.databasePath}`,
    ].join("\n");
  }

  const results = searchCodexConversationFlow({
    databasePath: parsed.databasePath,
    query: parsed.query,
    limit: parsed.limit,
  });

  if (results.length === 0) {
    return "No matches.";
  }

  return results
    .map(
      (result) =>
        [
          `${result.rank}. ${result.speaker} ${result.projectionPath}#${result.messageIndex}`,
          result.snippet,
        ].join("\n"),
    )
    .join("\n\n");
}

function parsePositiveInteger(value: string, flag: string): number {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`${flag} must be a positive integer`);
  }

  return parsed;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCodexConversationSearchCli(process.argv.slice(2))
    .then((output) => {
      process.stdout.write(`${output}\n`);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`${message}\n`);
      process.exitCode = 1;
    });
}
