import { access, mkdtemp, mkdir, readFile, utimes, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";

import {
  extractCodexConversationFlow,
  runCodexConversationFlowBatch,
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

  it("batch mode deletes a raw blob only after a non-empty projection is written", async () => {
    const root = await mkdtemp(join(tmpdir(), "continuum-conversation-batch-"));
    const blobs = join(root, "blobs");
    await mkdir(blobs, { recursive: true });
    const deletablePath = join(blobs, "deletable.jsonl");
    const retainedPath = join(blobs, "retained.jsonl");
    await writeFile(
      deletablePath,
      `${JSON.stringify({
        type: "response_item",
        payload: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: "Keep this conversation." }],
        },
      })}\n`,
      "utf8",
    );
    await writeFile(
      retainedPath,
      `${JSON.stringify({
        type: "response_item",
        payload: {
          type: "function_call_output",
          output: "tool noise only",
        },
      })}\n`,
      "utf8",
    );

    const result = await runCodexConversationFlowBatch({
      rootPath: blobs,
      outputDirectory: join(root, "projection"),
      manifestPath: join(root, "projection", "manifest.jsonl"),
      limit: 2,
      minimumSourceBytes: 0,
      minimumAgeSeconds: 0,
      maxMessageBytes: 1000,
      deleteRawAfterProjection: true,
      skipManifestRecordedSources: true,
      generatedAt: "2026-06-12T08:10:00.000Z",
    });

    await expect(access(deletablePath)).rejects.toThrow();
    await expect(access(retainedPath)).resolves.toBeUndefined();
    expect(result.deletedCount).toBe(1);
    expect(result.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceRelativePath: "deletable.jsonl",
          keptMessageCount: 1,
          deletedRawBlob: true,
          skippedDeletionReason: null,
        }),
        expect.objectContaining({
          sourceRelativePath: "retained.jsonl",
          keptMessageCount: 0,
          deletedRawBlob: false,
          skippedDeletionReason: "projection-kept-no-messages",
        }),
      ]),
    );
    expect(await readFile(join(root, "projection", "deletable.conversation-flow.txt"), "utf8")).toContain(
      "Peter:\nKeep this conversation.",
    );
  });

  it("batch mode does not touch blobs from the last minute", async () => {
    const root = await mkdtemp(join(tmpdir(), "continuum-conversation-fresh-"));
    const blobs = join(root, "blobs");
    await mkdir(blobs, { recursive: true });
    const freshPath = join(blobs, "fresh.jsonl");
    await writeFile(
      freshPath,
      `${JSON.stringify({
        type: "response_item",
        payload: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: "Do not touch this yet." }],
        },
      })}\n`,
      "utf8",
    );

    const result = await runCodexConversationFlowBatch({
      rootPath: blobs,
      outputDirectory: join(root, "projection"),
      manifestPath: join(root, "projection", "manifest.jsonl"),
      limit: 10,
      minimumSourceBytes: 0,
      minimumAgeSeconds: 60,
      maxMessageBytes: 1000,
      deleteRawAfterProjection: true,
      skipManifestRecordedSources: true,
      generatedAt: "2026-06-14T12:30:00.000Z",
    });

    await expect(access(freshPath)).resolves.toBeUndefined();
    expect(result.processedCount).toBe(0);
    expect(result.deletedCount).toBe(0);
  });

  it("batch mode skips blobs already recorded in the manifest", async () => {
    const root = await mkdtemp(join(tmpdir(), "continuum-conversation-manifest-"));
    const blobs = join(root, "blobs");
    const projection = join(root, "projection");
    await mkdir(blobs, { recursive: true });
    await mkdir(projection, { recursive: true });
    const oldPath = join(blobs, "already-seen.jsonl");
    await writeFile(
      oldPath,
      `${JSON.stringify({
        type: "response_item",
        payload: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: "Already handled." }],
        },
      })}\n`,
      "utf8",
    );
    const oldDate = new Date("2026-06-14T12:00:00.000Z");
    await utimes(oldPath, oldDate, oldDate);
    await writeFile(
      join(projection, "manifest.jsonl"),
      `${JSON.stringify({
        sourcePath: oldPath,
        sourceRelativePath: "already-seen.jsonl",
        deletedRawBlob: false,
        skippedDeletionReason: "projection-kept-no-messages",
      })}\n`,
      "utf8",
    );

    const result = await runCodexConversationFlowBatch({
      rootPath: blobs,
      outputDirectory: projection,
      manifestPath: join(projection, "manifest.jsonl"),
      limit: 10,
      minimumSourceBytes: 0,
      minimumAgeSeconds: 0,
      maxMessageBytes: 1000,
      deleteRawAfterProjection: true,
      skipManifestRecordedSources: true,
      generatedAt: "2026-06-14T12:30:00.000Z",
    });

    await expect(access(oldPath)).resolves.toBeUndefined();
    expect(result.processedCount).toBe(0);
    expect(result.deletedCount).toBe(0);
  });
});
