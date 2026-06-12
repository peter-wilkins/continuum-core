import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";

import {
  auditCodexSessionMirror,
  renderCodexSessionMirrorAuditMarkdown,
  writeCodexSessionMirrorAuditReport,
  type CodexSessionMirrorAuditCommand,
} from "./index";

async function createFixtureMirror(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "continuum-session-mirror-audit-"));
  const blobs = join(root, "blobs");
  await mkdir(blobs, { recursive: true });
  const duplicateContent = [
    JSON.stringify({ type: "message", role: "user", content: "private fixture user text" }),
    JSON.stringify({ type: "message", role: "assistant", content: "private fixture assistant text" }),
    "",
  ].join("\n");

  await writeFile(join(blobs, "one.jsonl"), duplicateContent, "utf8");
  await writeFile(join(blobs, "two.jsonl"), duplicateContent, "utf8");
  await writeFile(
    join(blobs, "malformed.jsonl"),
    `${JSON.stringify({ eventType: "tool_call", message: { role: "tool" } })}\nnot-json\n`,
    "utf8",
  );

  return root;
}

function createCommand(rootPath: string, outputDirectory: string): CodexSessionMirrorAuditCommand {
  return {
    rootPath,
    outputDirectory,
    generatedAt: "2026-06-12T10:30:00.000Z",
    largestFileLimit: 5,
    newestOldestLimit: 3,
    sampleFileLimit: 5,
    sampleLineLimit: 20,
    duplicateHashByteLimit: 1024 * 1024,
  };
}

describe("Codex session mirror audit", () => {
  it("reports exact duplicate blobs without deleting or rewriting raw files", async () => {
    const root = await createFixtureMirror();
    const report = await auditCodexSessionMirror(createCommand(root, join(root, "report")));

    expect(report.privacy).toEqual({
      rawBlobsDeleted: false,
      rawBlobsRewritten: false,
      reportContainsRawContent: false,
    });
    expect(report.totals.fileCount).toBe(3);
    expect(report.duplicates.exactDuplicateGroupCount).toBe(1);
    expect(report.duplicates.exactDuplicateFileCount).toBe(2);
    expect(report.duplicates.hashComplete).toBe(true);
    expect(await readFile(join(root, "blobs", "one.jsonl"), "utf8")).toContain(
      "private fixture user text",
    );
  });

  it("samples JSONL event shape without putting raw text into the markdown report", async () => {
    const root = await createFixtureMirror();
    const report = await auditCodexSessionMirror(createCommand(root, join(root, "report")));
    const markdown = renderCodexSessionMirrorAuditMarkdown(report);

    expect(report.jsonlShape.eventTypeHistogram).toMatchObject({
      message: 4,
      tool_call: 1,
    });
    expect(report.jsonlShape.roleHistogram).toMatchObject({
      user: 2,
      assistant: 2,
      tool: 1,
    });
    expect(report.jsonlShape.malformedLineCount).toBe(1);
    expect(markdown).not.toContain("private fixture user text");
    expect(markdown).not.toContain("private fixture assistant text");
  });

  it("writes small local JSON and Markdown summaries", async () => {
    const root = await createFixtureMirror();
    const command = createCommand(root, join(root, "local-report"));
    const report = await auditCodexSessionMirror(command);
    const paths = await writeCodexSessionMirrorAuditReport(command, report);
    const json = await readFile(paths.jsonPath, "utf8");
    const markdown = await readFile(paths.markdownPath, "utf8");

    expect(JSON.parse(json)).toMatchObject({
      schemaVersion: "continuum.codex.session-mirror.audit.v1",
      totals: {
        fileCount: 3,
      },
    });
    expect(markdown).toContain("# Codex Session Mirror Storage Audit");
    expect(markdown).toContain("Raw blobs rewritten: false");
  });
});
