import { mkdir, opendir, readFile, rm } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import type { DatabaseSync as DatabaseSyncType } from "node:sqlite";

const sqlite = process.getBuiltinModule("node:sqlite") as {
  DatabaseSync: typeof DatabaseSyncType;
};
const { DatabaseSync } = sqlite;
type SqliteDatabase = InstanceType<typeof DatabaseSync>;

export type CodexConversationSearchIndexCommand = {
  inputDirectory: string;
  databasePath: string;
  generatedAt: string;
  reset: boolean;
};

export type CodexConversationSearchIndexResult = {
  databasePath: string;
  inputDirectory: string;
  indexedFileCount: number;
  indexedMessageCount: number;
};

export type CodexConversationSearchCommand = {
  databasePath: string;
  query: string;
  limit: number;
};

export type CodexConversationSearchResult = {
  rank: number;
  speaker: "Peter" | "Agent";
  snippet: string;
  excerpt: string;
  projectionPath: string;
  sourceLabel: string;
  messageIndex: number;
};

type ConversationFlowMessage = {
  speaker: "Peter" | "Agent";
  text: string;
  messageIndex: number;
};

export async function indexCodexConversationFlow(
  command: CodexConversationSearchIndexCommand,
): Promise<CodexConversationSearchIndexResult> {
  const inputDirectory = resolve(command.inputDirectory);
  const databasePath = resolve(command.databasePath);

  if (command.reset) {
    await rm(databasePath, { force: true });
    await rm(`${databasePath}-wal`, { force: true });
    await rm(`${databasePath}-shm`, { force: true });
  }

  await mkdir(dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath);

  try {
    prepareSchema(database);
    const insert = database.prepare(
      "INSERT INTO conversation_messages_fts(speaker, text, projection_path, source_label, message_index) VALUES (?, ?, ?, ?, ?)",
    );
    const files = await discoverConversationFlowFiles(inputDirectory);
    let indexedMessageCount = 0;

    database.exec("BEGIN");
    try {
      for (const file of files) {
        const text = await readFile(file, "utf8");
        const sourceLabel = readSourceLabel(text);
        const messages = parseConversationFlowMessages(text);
        const projectionPath = relative(inputDirectory, file).split(sep).join("/");

        for (const message of messages) {
          insert.run(
            message.speaker,
            message.text,
            projectionPath,
            sourceLabel,
            message.messageIndex,
          );
          indexedMessageCount += 1;
        }
      }

      database
        .prepare("INSERT INTO conversation_search_metadata(key, value) VALUES (?, ?)")
        .run("generatedAt", command.generatedAt);
      database
        .prepare("INSERT INTO conversation_search_metadata(key, value) VALUES (?, ?)")
        .run("inputDirectory", inputDirectory);
      database.exec("COMMIT");
    } catch (error: unknown) {
      database.exec("ROLLBACK");
      throw error;
    }

    return {
      databasePath,
      inputDirectory,
      indexedFileCount: files.length,
      indexedMessageCount,
    };
  } finally {
    database.close();
  }
}

export function searchCodexConversationFlow(
  command: CodexConversationSearchCommand,
): CodexConversationSearchResult[] {
  if (command.limit < 1) {
    throw new Error("limit must be at least 1");
  }

  const database = new DatabaseSync(resolve(command.databasePath), { readOnly: true });

  try {
    const ftsQuery = buildFtsQuery(command.query);
    const rows = database
      .prepare(
        `
        SELECT
          speaker,
          snippet(conversation_messages_fts, 1, '[', ']', '...', 18) AS snippet,
          substr(text, 1, 900) AS excerpt,
          projection_path AS projectionPath,
          source_label AS sourceLabel,
          message_index AS messageIndex,
          bm25(conversation_messages_fts) AS score
        FROM conversation_messages_fts
        WHERE conversation_messages_fts MATCH ?
        ORDER BY score
        LIMIT ?
        `,
      )
      .all(ftsQuery, command.limit);

    return rows.map((row, index) => ({
      rank: index + 1,
      speaker: readSpeaker(row.speaker),
      snippet: String(row.snippet),
      excerpt: String(row.excerpt),
      projectionPath: String(row.projectionPath),
      sourceLabel: String(row.sourceLabel),
      messageIndex: Number(row.messageIndex),
    }));
  } finally {
    database.close();
  }
}

export function parseConversationFlowMessages(text: string): ConversationFlowMessage[] {
  const messages: ConversationFlowMessage[] = [];
  let currentSpeaker: "Peter" | "Agent" | null = null;
  let currentLines: string[] = [];

  function flush(): void {
    if (currentSpeaker === null) {
      return;
    }

    const messageText = currentLines.join("\n").trim();

    if (messageText.length > 0) {
      messages.push({
        speaker: currentSpeaker,
        text: messageText,
        messageIndex: messages.length,
      });
    }
  }

  for (const line of text.split(/\r?\n/)) {
    if (line === "Peter:" || line === "Agent:") {
      flush();
      currentSpeaker = line === "Peter:" ? "Peter" : "Agent";
      currentLines = [];
      continue;
    }

    if (currentSpeaker === null) {
      continue;
    }

    currentLines.push(line);
  }

  flush();
  return messages;
}

function prepareSchema(database: SqliteDatabase): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS conversation_search_metadata (
      key TEXT NOT NULL,
      value TEXT NOT NULL
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS conversation_messages_fts USING fts5(
      speaker,
      text,
      projection_path UNINDEXED,
      source_label UNINDEXED,
      message_index UNINDEXED,
      tokenize = 'unicode61'
    );
  `);
}

async function discoverConversationFlowFiles(directory: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentDirectory: string): Promise<void> {
    const entries = await opendir(currentDirectory);

    for await (const entry of entries) {
      const entryPath = join(currentDirectory, entry.name);

      if (entry.isDirectory()) {
        await walk(entryPath);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith(".conversation-flow.txt")) {
        files.push(entryPath);
      }
    }
  }

  await walk(directory);
  return files.sort((left, right) => left.localeCompare(right));
}

function readSourceLabel(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  return firstLine.startsWith("Source: ") ? firstLine.slice("Source: ".length) : "unknown";
}

function buildFtsQuery(query: string): string {
  const terms = query
    .toLowerCase()
    .match(/[\p{L}\p{N}_'-]+/gu)
    ?.filter((term) => term.length > 0) ?? [];

  if (terms.length === 0) {
    throw new Error("query must contain at least one searchable word");
  }

  return terms.map((term) => `"${term.replaceAll('"', '""')}"`).join(" AND ");
}

function readSpeaker(value: unknown): "Peter" | "Agent" {
  if (value === "Peter" || value === "Agent") {
    return value;
  }

  throw new Error(`Unexpected speaker in search index: ${String(value)}`);
}
