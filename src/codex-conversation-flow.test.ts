import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";

import {
  extractCodexConversationFlow,
  writeCodexConversationFlow,
} from "./codex-conversation-flow";

async function writeFixtureSession(lines: unknown[]): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "continuum-conversation-flow-"));
  const path = join(root, "session.jsonl");
  await writeFile(path, `${lines.map((line) => JSON.stringify(line)).join("\n")}\n`, "utf8");
  return path;
}

describe("Codex conversation flow projection", () => {
  it("writes a plain Peter and Agent conversation flow without tool noise", async () => {
    const path = await writeFixtureSession([
      {
        type: "response_item",
        payload: {
          type: "message",
          role: "developer",
          content: [{ type: "input_text", text: "Never show developer setup." }],
        },
      },
      {
        type: "response_item",
        payload: {
          type: "message",
          role: "user",
          content: [
            { type: "input_text", text: "Please audit the mirror." },
            { type: "input_text", text: "<environment_context>secret setup</environment_context>" },
          ],
        },
      },
      {
        type: "response_item",
        payload: {
          type: "reasoning",
          summary: [{ text: "Do not keep reasoning noise." }],
        },
      },
      {
        type: "response_item",
        payload: {
          type: "function_call_output",
          output: "Do not keep command output.",
        },
      },
      {
        type: "response_item",
        payload: {
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: "Done. Report is under local/reports." }],
        },
      },
    ]);

    const result = await extractCodexConversationFlow({
      inputPath: path,
      outputPath: join(tmpdir(), "unused.txt"),
      sourceLabel: "fixture-session",
      maxMessageBytes: 1000,
    });

    expect(result.text).toBe(
      [
        "Source: fixture-session",
        "",
        "Peter:",
        "Please audit the mirror.",
        "",
        "Agent:",
        "Done. Report is under local/reports.",
        "",
      ].join("\n"),
    );
    expect(result.text).not.toContain("developer setup");
    expect(result.text).not.toContain("secret setup");
    expect(result.text).not.toContain("reasoning noise");
    expect(result.text).not.toContain("command output");
    expect(result.stats.keptMessageCount).toBe(2);
    expect(result.stats.skippedRecordCount).toBe(3);
  });

  it("clips very large messages so a review projection stays bounded", async () => {
    const path = await writeFixtureSession([
      {
        type: "response_item",
        payload: {
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: "abcdef" }],
        },
      },
    ]);

    const result = await extractCodexConversationFlow({
      inputPath: path,
      outputPath: join(tmpdir(), "unused.txt"),
      sourceLabel: "fixture-session",
      maxMessageBytes: 3,
    });

    expect(result.text).toContain("abc\n[truncated]");
    expect(result.stats.truncatedMessageCount).toBe(1);
  });

  it("writes the flow file and reports small output stats", async () => {
    const path = await writeFixtureSession([
      {
        type: "response_item",
        payload: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: "y" }],
        },
      },
    ]);
    const outputPath = join(await mkdtemp(join(tmpdir(), "continuum-conversation-output-")), "flow.txt");
    const stats = await writeCodexConversationFlow({
      inputPath: path,
      outputPath,
      sourceLabel: "fixture-session",
      maxMessageBytes: 1000,
    });

    expect(await readFile(outputPath, "utf8")).toContain("Peter:\ny");
    expect(stats.keptMessageCount).toBe(1);
    expect(stats.outputBytes).toBeGreaterThan(0);
  });
});
