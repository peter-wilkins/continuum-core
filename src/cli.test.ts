import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { runContinuumImportCli } from "./cli";

const fixturePath = fileURLToPath(
  new URL("./fixtures/chatgpt-one-conversation.json", import.meta.url),
);

describe("continuum-import CLI", () => {
  it("exports one ChatGPT conversation fixture to canonical event JSONL", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-import-"));
    const outputPath = join(dir, "events.jsonl");

    try {
      const result = await runContinuumImportCli([
        "chatgpt",
        fixturePath,
        "--out",
        outputPath,
      ]);

      expect(result).toEqual({
        eventsWritten: 2,
        outputPath,
        report: {
          new: 2,
          known: 0,
          changed: 0,
          uncertain: 0,
        },
      });

      const lines = (await readFile(outputPath, "utf8")).trim().split("\n");

      expect(lines).toHaveLength(2);
      expect(lines.map((line) => JSON.parse(line))).toMatchObject([
        {
          source: {
            platform: "chatgpt",
            externalConversationId: "conv_123",
            externalMessageId: "msg_456",
          },
          actor: { role: "user" },
          content: { text: "Need to quote Bob for the boiler." },
        },
        {
          source: {
            platform: "chatgpt",
            externalConversationId: "conv_123",
            externalMessageId: "msg_789",
          },
          actor: { role: "assistant" },
          content: {
            text: "You should ask Bob whether the boiler is combi or system.",
          },
        },
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("imports the same ChatGPT fixture twice without duplicating canonical events", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-import-"));
    const outputPath = join(dir, "events.jsonl");

    try {
      await runContinuumImportCli([
        "chatgpt",
        fixturePath,
        "--out",
        outputPath,
      ]);
      const secondResult = await runContinuumImportCli([
        "chatgpt",
        fixturePath,
        "--out",
        outputPath,
      ]);

      expect(secondResult).toEqual({
        eventsWritten: 0,
        outputPath,
        report: {
          new: 0,
          known: 2,
          changed: 0,
          uncertain: 0,
        },
      });

      const lines = (await readFile(outputPath, "utf8")).trim().split("\n");

      expect(lines).toHaveLength(2);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
