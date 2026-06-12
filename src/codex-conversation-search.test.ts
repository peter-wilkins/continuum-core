import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";

import {
  indexCodexConversationFlow,
  parseConversationFlowMessages,
  searchCodexConversationFlow,
} from "./codex-conversation-search";

describe("Codex conversation search", () => {
  it("parses plain Peter and Agent conversation flow messages", () => {
    const messages = parseConversationFlowMessages(
      [
        "Source: fixture",
        "",
        "Peter:",
        "Can we search blog ideas?",
        "",
        "Agent:",
        "Yes. Put the projection into SQLite FTS.",
        "",
      ].join("\n"),
    );

    expect(messages).toEqual([
      {
        speaker: "Peter",
        text: "Can we search blog ideas?",
        messageIndex: 0,
      },
      {
        speaker: "Agent",
        text: "Yes. Put the projection into SQLite FTS.",
        messageIndex: 1,
      },
    ]);
  });

  it("indexes conversation flow files into a rebuildable SQLite search cache", async () => {
    const root = await mkdtemp(join(tmpdir(), "continuum-conversation-search-"));
    const flowDir = join(root, "flow");
    await mkdir(flowDir, { recursive: true });
    await writeFile(
      join(flowDir, "one.conversation-flow.txt"),
      [
        "Source: fixture-one",
        "",
        "Peter:",
        "I want blog posts about extended thought.",
        "",
        "Agent:",
        "Use the conversation flow as source material for writing.",
        "",
      ].join("\n"),
      "utf8",
    );
    await writeFile(
      join(flowDir, "two.conversation-flow.txt"),
      [
        "Source: fixture-two",
        "",
        "Peter:",
        "This one is about phone testing.",
        "",
      ].join("\n"),
      "utf8",
    );
    const databasePath = join(root, "search.sqlite");
    const indexResult = await indexCodexConversationFlow({
      inputDirectory: flowDir,
      databasePath,
      generatedAt: "2026-06-12T09:00:00.000Z",
      reset: true,
    });
    const results = searchCodexConversationFlow({
      databasePath,
      query: "blog extended thought",
      limit: 5,
    });

    expect(indexResult).toMatchObject({
      indexedFileCount: 2,
      indexedMessageCount: 3,
    });
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      speaker: "Peter",
      projectionPath: "one.conversation-flow.txt",
      sourceLabel: "fixture-one",
      messageIndex: 0,
    });
    expect(results[0]?.snippet).toContain("[blog]");
  });
});
