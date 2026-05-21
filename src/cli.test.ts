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
});
