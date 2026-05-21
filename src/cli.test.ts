import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { runContinuumImportCli } from "./cli";

const fixturePath = fileURLToPath(
  new URL("./fixtures/chatgpt-one-conversation.json", import.meta.url),
);
const claudeFixturePath = fileURLToPath(
  new URL("./fixtures/claude-one-conversation.json", import.meta.url),
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
        command: "import",
        eventsWritten: 2,
        outputPath,
        report: {
          new: 2,
          known: 0,
          changed: 0,
          uncertain: 0,
        },
        quarantine: [],
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
        command: "import",
        eventsWritten: 0,
        outputPath,
        report: {
          new: 0,
          known: 2,
          changed: 0,
          uncertain: 0,
        },
        quarantine: [],
      });

      const lines = (await readFile(outputPath, "utf8")).trim().split("\n");

      expect(lines).toHaveLength(2);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("exports one Claude conversation fixture to canonical event JSONL", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-import-"));
    const outputPath = join(dir, "events.jsonl");

    try {
      const result = await runContinuumImportCli([
        "claude",
        claudeFixturePath,
        "--out",
        outputPath,
      ]);

      expect(result).toEqual({
        command: "import",
        eventsWritten: 2,
        outputPath,
        report: {
          new: 2,
          known: 0,
          changed: 0,
          uncertain: 0,
        },
        quarantine: [],
      });

      const lines = (await readFile(outputPath, "utf8")).trim().split("\n");

      expect(lines).toHaveLength(2);
      expect(lines.map((line) => JSON.parse(line))).toMatchObject([
        {
          source: {
            platform: "claude",
            externalConversationId: "claude_conv_123",
            externalMessageId: "claude_msg_456",
          },
          provenance: {
            sourceFamily: "ai_chat_export",
            sourceName: "claude",
          },
          actor: { role: "user" },
        },
        {
          source: {
            platform: "claude",
            externalConversationId: "claude_conv_123",
            externalMessageId: "claude_msg_789",
            externalParentId: "claude_msg_456",
          },
          actor: { role: "assistant" },
        },
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("inspects one Claude export without writing events", async () => {
    const result = await runContinuumImportCli([
      "inspect",
      "claude",
      claudeFixturePath,
    ]);

    expect(result).toEqual({
      command: "inspect",
      sourcePlatform: "claude",
      sourceName: "claude",
      inputPath: claudeFixturePath,
      conversationsSeen: 1,
      recordsSeen: 2,
      validationErrors: 0,
      importableEvents: 2,
    });
  });

  it("dry-runs one Claude export into an import batch preview", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-import-"));
    const previewPath = join(dir, "preview.json");

    try {
      const result = await runContinuumImportCli([
        "dry-run",
        "claude",
        claudeFixturePath,
        "--out",
        previewPath,
      ]);

      expect(result.command).toBe("dry-run");
      if (result.command !== "dry-run") {
        throw new Error("Expected dry-run result.");
      }
      expect(result.previewPath).toBe(previewPath);
      expect(result.batch.sourcePlatform).toBe("claude");
      expect(result.batch.stats.recordsSeen).toBe(2);
      expect(result.batch.stats.eventsCreated).toBe(2);
      expect(result.batch.stats.recordsQuarantined).toBe(0);

      const preview = JSON.parse(await readFile(previewPath, "utf8"));

      expect(preview.report).toEqual({
        new: 2,
        known: 0,
        changed: 0,
        uncertain: 0,
      });
      expect(preview.events).toHaveLength(2);
      expect(preview.quarantine).toEqual([]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
