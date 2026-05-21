import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";

import { formatContinuumImportCliResult, runContinuumImportCli } from "./cli";

const fixturePath = fileURLToPath(
  new URL("./fixtures/chatgpt-one-conversation.json", import.meta.url),
);
const claudeFixturePath = fileURLToPath(
  new URL("./fixtures/claude-one-conversation.json", import.meta.url),
);
const chromeHistoryFixturePath = fileURLToPath(
  new URL("./fixtures/google-chrome-history-one-record.json", import.meta.url),
);
const chromeBookmarksFixturePath = fileURLToPath(
  new URL("./fixtures/google-chrome-bookmarks-one-record.html", import.meta.url),
);
const chromeReadingListFixturePath = fileURLToPath(
  new URL("./fixtures/google-chrome-reading-list-one-record.html", import.meta.url),
);
const googleMyActivityFixturePath = fileURLToPath(
  new URL("./fixtures/google-my-activity-three-records.json", import.meta.url),
);

describe("continuum-import CLI", () => {
  it("formats inspect output with warnings and source file counts", () => {
    expect(
      formatContinuumImportCliResult({
        command: "inspect",
        sourcePlatform: "google-takeout-folder",
        sourceName: "google-takeout-folder",
        inputPath: "/tmp/takeout",
        conversationsSeen: 0,
        recordsSeen: 6,
        validationErrors: 0,
        importableEvents: 6,
        warnings: 1,
        sourceFiles: [
          {
            path: "Takeout/metadata.txt",
            source: null,
            status: "skipped",
            eventsCreated: 0,
            quarantineRecords: 0,
          },
        ],
      }),
    ).toBe(
      "Detected google-takeout-folder conversations=0 records=6 importable=6 validationErrors=0 warnings=1 sourceFiles=1\n",
    );
  });

  it("formats dry-run output with warnings and source file counts", () => {
    expect(
      formatContinuumImportCliResult({
        command: "dry-run",
        previewPath: "/tmp/preview.json",
        batch: {
          id: "batch:abc",
          sourcePlatform: "google-takeout-zip",
          sourceName: "google-takeout-zip",
          originalFilename: "takeout.zip",
          originalFileHash: "abc",
          createdAt: "unknown",
          completedAt: null,
          status: "previewed",
          stats: {
            filesSeen: 3,
            recordsSeen: 2,
            eventsCreated: 2,
            eventsKnown: 0,
            eventsChanged: 0,
            eventsUncertain: 0,
            recordsQuarantined: 0,
            warnings: 1,
          },
        },
        report: {
          new: 2,
          known: 0,
          changed: 0,
          uncertain: 0,
        },
        quarantine: [],
      }),
    ).toBe(
      "Preview written to /tmp/preview.json\nReport new=2 known=0 changed=0 uncertain=0 quarantined=0 warnings=1 sourceFiles=3\n",
    );
  });

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
        warnings: 0,
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
        warnings: 0,
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
        warnings: 0,
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
      warnings: 0,
      sourceFiles: [],
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

  it("imports one Chrome history fixture through the CLI", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-import-"));
    const outputPath = join(dir, "events.jsonl");
    const chromeHistoryExportPath = join(dir, "chrome-history.json");

    try {
      const chromeHistoryFixture = JSON.parse(
        await readFile(chromeHistoryFixturePath, "utf8"),
      );
      await writeFile(
        chromeHistoryExportPath,
        JSON.stringify({ "Browser History": [chromeHistoryFixture.history] }),
        "utf8",
      );

      const result = await runContinuumImportCli([
        "google-chrome-history",
        chromeHistoryExportPath,
        "--out",
        outputPath,
      ]);

      expect(result).toMatchObject({
        command: "import",
        eventsWritten: 1,
        outputPath,
        report: {
          new: 1,
          known: 0,
          changed: 0,
          uncertain: 0,
        },
      });

      const lines = (await readFile(outputPath, "utf8")).trim().split("\n");
      expect(lines).toHaveLength(1);
      expect(JSON.parse(lines[0] ?? "{}")).toMatchObject({
        source: {
          platform: "google_chrome",
          externalConversationId: "chrome-client-123",
        },
        content: {
          subject: "Continuum core issue tracker",
        },
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("dry-runs Chrome bookmarks HTML through the CLI", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-import-"));
    const previewPath = join(dir, "preview.json");

    try {
      const result = await runContinuumImportCli([
        "dry-run",
        "google-chrome-bookmarks",
        chromeBookmarksFixturePath,
        "--out",
        previewPath,
      ]);

      expect(result.command).toBe("dry-run");
      if (result.command !== "dry-run") {
        throw new Error("Expected dry-run result.");
      }
      expect(result.batch.sourcePlatform).toBe("google-chrome-bookmarks");
      expect(result.batch.stats.recordsSeen).toBe(1);
      expect(result.batch.stats.eventsCreated).toBe(1);

      const preview = JSON.parse(await readFile(previewPath, "utf8"));
      expect(preview.events).toEqual([
        expect.objectContaining({
          platform: "google_chrome",
          subject: "Continuum core",
        }),
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("inspects Chrome reading list HTML through the CLI", async () => {
    const result = await runContinuumImportCli([
      "inspect",
      "google-chrome-reading-list",
      chromeReadingListFixturePath,
    ]);

    expect(result).toEqual({
      command: "inspect",
      sourcePlatform: "google-chrome-reading-list",
      sourceName: "google-chrome-reading-list",
      inputPath: chromeReadingListFixturePath,
      conversationsSeen: 0,
      recordsSeen: 1,
      validationErrors: 0,
      importableEvents: 1,
      warnings: 0,
      sourceFiles: [],
    });
  });

  it("imports mixed Google My Activity records through the CLI", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-import-"));
    const outputPath = join(dir, "events.jsonl");

    try {
      const result = await runContinuumImportCli([
        "google-my-activity",
        googleMyActivityFixturePath,
        "--out",
        outputPath,
      ]);

      expect(result).toMatchObject({
        command: "import",
        eventsWritten: 3,
        outputPath,
        report: {
          new: 3,
          known: 0,
          changed: 0,
          uncertain: 0,
        },
      });

      const lines = (await readFile(outputPath, "utf8")).trim().split("\n");
      expect(lines).toHaveLength(3);
      expect(lines.map((line) => JSON.parse(line).source.externalConversationId)).toEqual([
        "YouTube",
        "Search",
        "Maps",
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("inspects a Google Takeout folder and routes known files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-takeout-"));

    try {
      const chromeDir = join(dir, "Takeout", "Chrome");
      const activityDir = join(dir, "Takeout", "My Activity", "YouTube");
      await mkdir(chromeDir, { recursive: true });
      await mkdir(activityDir, { recursive: true });

      const chromeHistoryFixture = JSON.parse(
        await readFile(chromeHistoryFixturePath, "utf8"),
      );
      await writeFile(
        join(chromeDir, "BrowserHistory.json"),
        JSON.stringify({ "Browser History": [chromeHistoryFixture.history] }),
        "utf8",
      );
      await writeFile(
        join(chromeDir, "Bookmarks.html"),
        await readFile(chromeBookmarksFixturePath, "utf8"),
        "utf8",
      );
      await writeFile(
        join(chromeDir, "ReadingList.html"),
        await readFile(chromeReadingListFixturePath, "utf8"),
        "utf8",
      );
      await writeFile(
        join(activityDir, "MyActivity.json"),
        await readFile(googleMyActivityFixturePath, "utf8"),
        "utf8",
      );
      await writeFile(join(dir, "Takeout", "unknown.txt"), "skip me", "utf8");

      const result = await runContinuumImportCli([
        "inspect",
        "google-takeout-folder",
        dir,
      ]);

      expect(result).toEqual({
        command: "inspect",
        sourcePlatform: "google-takeout-folder",
        sourceName: "google-takeout-folder",
        inputPath: dir,
        conversationsSeen: 0,
        recordsSeen: 6,
        validationErrors: 0,
        importableEvents: 6,
        warnings: 1,
        sourceFiles: [
          {
            path: "Takeout/Chrome/Bookmarks.html",
            source: "google-chrome-bookmarks",
            status: "matched",
            eventsCreated: 1,
            quarantineRecords: 0,
          },
          {
            path: "Takeout/Chrome/BrowserHistory.json",
            source: "google-chrome-history",
            status: "matched",
            eventsCreated: 1,
            quarantineRecords: 0,
          },
          {
            path: "Takeout/Chrome/ReadingList.html",
            source: "google-chrome-reading-list",
            status: "matched",
            eventsCreated: 1,
            quarantineRecords: 0,
          },
          {
            path: "Takeout/My Activity/YouTube/MyActivity.json",
            source: "google-my-activity",
            status: "matched",
            eventsCreated: 3,
            quarantineRecords: 0,
          },
          {
            path: "Takeout/unknown.txt",
            source: null,
            status: "skipped",
            eventsCreated: 0,
            quarantineRecords: 0,
          },
        ],
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("dry-runs a Google Takeout folder into one combined preview", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-takeout-"));
    const previewPath = join(dir, "preview.json");

    try {
      const chromeDir = join(dir, "Takeout", "Chrome");
      const activityDir = join(dir, "Takeout", "My Activity", "YouTube");
      await mkdir(chromeDir, { recursive: true });
      await mkdir(activityDir, { recursive: true });

      const chromeHistoryFixture = JSON.parse(
        await readFile(chromeHistoryFixturePath, "utf8"),
      );
      await writeFile(
        join(chromeDir, "BrowserHistory.json"),
        JSON.stringify({ "Browser History": [chromeHistoryFixture.history] }),
        "utf8",
      );
      await writeFile(
        join(chromeDir, "Bookmarks.html"),
        await readFile(chromeBookmarksFixturePath, "utf8"),
        "utf8",
      );
      await writeFile(
        join(activityDir, "MyActivity.json"),
        await readFile(googleMyActivityFixturePath, "utf8"),
        "utf8",
      );

      const result = await runContinuumImportCli([
        "dry-run",
        "google-takeout-folder",
        dir,
        "--out",
        previewPath,
      ]);

      expect(result.command).toBe("dry-run");
      if (result.command !== "dry-run") {
        throw new Error("Expected dry-run result.");
      }

      expect(result.batch.sourcePlatform).toBe("google-takeout-folder");
      expect(result.batch.stats.filesSeen).toBe(3);
      expect(result.batch.stats.recordsSeen).toBe(5);
      expect(result.batch.stats.eventsCreated).toBe(5);

      const preview = JSON.parse(await readFile(previewPath, "utf8"));
      expect(preview.events).toHaveLength(5);
      expect(preview.events.map((event: { platform: string }) => event.platform)).toEqual([
        "google_chrome",
        "google_chrome",
        "google_activity",
        "google_activity",
        "google_activity",
      ]);
      expect(preview.sourceFiles).toEqual([
        {
          path: "Takeout/Chrome/Bookmarks.html",
          source: "google-chrome-bookmarks",
          status: "matched",
          eventsCreated: 1,
          quarantineRecords: 0,
        },
        {
          path: "Takeout/Chrome/BrowserHistory.json",
          source: "google-chrome-history",
          status: "matched",
          eventsCreated: 1,
          quarantineRecords: 0,
        },
        {
          path: "Takeout/My Activity/YouTube/MyActivity.json",
          source: "google-my-activity",
          status: "matched",
          eventsCreated: 3,
          quarantineRecords: 0,
        },
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("imports a Google Takeout folder idempotently", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-takeout-"));
    const outputPath = join(dir, "events.jsonl");

    try {
      const chromeDir = join(dir, "Takeout", "Chrome");
      const activityDir = join(dir, "Takeout", "My Activity", "Search");
      await mkdir(chromeDir, { recursive: true });
      await mkdir(activityDir, { recursive: true });

      const chromeHistoryFixture = JSON.parse(
        await readFile(chromeHistoryFixturePath, "utf8"),
      );
      await writeFile(
        join(chromeDir, "BrowserHistory.json"),
        JSON.stringify({ "Browser History": [chromeHistoryFixture.history] }),
        "utf8",
      );
      await writeFile(
        join(chromeDir, "Bookmarks.html"),
        await readFile(chromeBookmarksFixturePath, "utf8"),
        "utf8",
      );
      await writeFile(
        join(activityDir, "MyActivity.json"),
        await readFile(googleMyActivityFixturePath, "utf8"),
        "utf8",
      );

      const first = await runContinuumImportCli([
        "google-takeout-folder",
        dir,
        "--out",
        outputPath,
      ]);
      const second = await runContinuumImportCli([
        "google-takeout-folder",
        dir,
        "--out",
        outputPath,
      ]);

      expect(first).toMatchObject({
        command: "import",
        eventsWritten: 5,
        warnings: 0,
        report: {
          new: 5,
          known: 0,
          changed: 0,
          uncertain: 0,
        },
      });
      expect(second).toMatchObject({
        command: "import",
        eventsWritten: 0,
        warnings: 0,
        report: {
          new: 0,
          known: 5,
          changed: 0,
          uncertain: 0,
        },
      });

      const lines = (await readFile(outputPath, "utf8")).trim().split("\n");
      expect(lines).toHaveLength(5);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("reports skipped-file warnings when importing a Google Takeout folder", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-takeout-"));
    const outputPath = join(dir, "events.jsonl");

    try {
      const chromeDir = join(dir, "Takeout", "Chrome");
      await mkdir(chromeDir, { recursive: true });
      await writeFile(
        join(chromeDir, "Bookmarks.html"),
        await readFile(chromeBookmarksFixturePath, "utf8"),
        "utf8",
      );
      await writeFile(join(dir, "Takeout", "metadata.txt"), "skip me", "utf8");

      const result = await runContinuumImportCli([
        "google-takeout-folder",
        dir,
        "--out",
        outputPath,
      ]);

      expect(result).toMatchObject({
        command: "import",
        eventsWritten: 1,
        warnings: 1,
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("classifies known Google JSON files by schema when filenames are generic", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-takeout-"));

    try {
      const googleDir = join(dir, "Takeout", "Google");
      await mkdir(googleDir, { recursive: true });

      const chromeHistoryFixture = JSON.parse(
        await readFile(chromeHistoryFixturePath, "utf8"),
      );
      await writeFile(
        join(googleDir, "Records.json"),
        JSON.stringify({ "Browser History": [chromeHistoryFixture.history] }),
        "utf8",
      );
      await writeFile(
        join(googleDir, "Activity.json"),
        await readFile(googleMyActivityFixturePath, "utf8"),
        "utf8",
      );

      const result = await runContinuumImportCli([
        "inspect",
        "google-takeout-folder",
        dir,
      ]);

      expect(result).toMatchObject({
        command: "inspect",
        recordsSeen: 4,
        validationErrors: 0,
        importableEvents: 4,
        warnings: 0,
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("dry-runs a Google Takeout zip through the same source classifier", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-takeout-"));
    const zipPath = join(dir, "takeout.zip");
    const previewPath = join(dir, "preview.json");

    try {
      const chromeHistoryFixture = JSON.parse(
        await readFile(chromeHistoryFixturePath, "utf8"),
      );
      const zipped = zipSync({
        "Takeout/Chrome/BrowserHistory.json": strToU8(
          JSON.stringify({ "Browser History": [chromeHistoryFixture.history] }),
        ),
        "Takeout/Chrome/Bookmarks.html": strToU8(
          await readFile(chromeBookmarksFixturePath, "utf8"),
        ),
        "Takeout/notes.txt": strToU8("skip me"),
      });
      await writeFile(zipPath, zipped);

      const result = await runContinuumImportCli([
        "dry-run",
        "google-takeout-zip",
        zipPath,
        "--out",
        previewPath,
      ]);

      expect(result.command).toBe("dry-run");
      if (result.command !== "dry-run") {
        throw new Error("Expected dry-run result.");
      }
      expect(result.batch.sourcePlatform).toBe("google-takeout-zip");
      expect(result.batch.stats.filesSeen).toBe(3);
      expect(result.batch.stats.recordsSeen).toBe(2);
      expect(result.batch.stats.eventsCreated).toBe(2);
      expect(result.batch.stats.warnings).toBe(1);

      const preview = JSON.parse(await readFile(previewPath, "utf8"));
      expect(preview.sourceFiles).toEqual([
        {
          path: "Takeout/Chrome/Bookmarks.html",
          source: "google-chrome-bookmarks",
          status: "matched",
          eventsCreated: 1,
          quarantineRecords: 0,
        },
        {
          path: "Takeout/Chrome/BrowserHistory.json",
          source: "google-chrome-history",
          status: "matched",
          eventsCreated: 1,
          quarantineRecords: 0,
        },
        {
          path: "Takeout/notes.txt",
          source: null,
          status: "skipped",
          eventsCreated: 0,
          quarantineRecords: 0,
        },
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("inspects and imports a Google Takeout zip idempotently", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-takeout-"));
    const zipPath = join(dir, "takeout.zip");
    const outputPath = join(dir, "events.jsonl");

    try {
      const chromeHistoryFixture = JSON.parse(
        await readFile(chromeHistoryFixturePath, "utf8"),
      );
      const zipped = zipSync({
        "Takeout/Chrome/BrowserHistory.json": strToU8(
          JSON.stringify({ "Browser History": [chromeHistoryFixture.history] }),
        ),
        "Takeout/My Activity/Search/MyActivity.json": strToU8(
          await readFile(googleMyActivityFixturePath, "utf8"),
        ),
      });
      await writeFile(zipPath, zipped);

      const inspected = await runContinuumImportCli([
        "inspect",
        "google-takeout-zip",
        zipPath,
      ]);
      const first = await runContinuumImportCli([
        "google-takeout-zip",
        zipPath,
        "--out",
        outputPath,
      ]);
      const second = await runContinuumImportCli([
        "google-takeout-zip",
        zipPath,
        "--out",
        outputPath,
      ]);

      expect(inspected).toMatchObject({
        command: "inspect",
        recordsSeen: 4,
        validationErrors: 0,
        importableEvents: 4,
        warnings: 0,
      });
      expect(first).toMatchObject({
        command: "import",
        eventsWritten: 4,
        warnings: 0,
      });
      expect(second).toMatchObject({
        command: "import",
        eventsWritten: 0,
        warnings: 0,
        report: {
          new: 0,
          known: 4,
          changed: 0,
          uncertain: 0,
        },
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("quarantines malformed JSON inside a Google Takeout folder", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-takeout-"));
    const previewPath = join(dir, "preview.json");

    try {
      const chromeDir = join(dir, "Takeout", "Chrome");
      await mkdir(chromeDir, { recursive: true });
      await writeFile(join(chromeDir, "BrowserHistory.json"), "{", "utf8");

      const result = await runContinuumImportCli([
        "dry-run",
        "google-takeout-folder",
        dir,
        "--out",
        previewPath,
      ]);

      expect(result.command).toBe("dry-run");
      if (result.command !== "dry-run") {
        throw new Error("Expected dry-run result.");
      }
      expect(result.batch.stats.recordsQuarantined).toBe(1);
      expect(result.batch.stats.warnings).toBe(0);

      const preview = JSON.parse(await readFile(previewPath, "utf8"));
      expect(preview.sourceFiles).toEqual([
        {
          path: "Takeout/Chrome/BrowserHistory.json",
          source: "google-chrome-history",
          status: "invalid",
          eventsCreated: 0,
          quarantineRecords: 1,
        },
      ]);
      expect(preview.quarantine[0]).toMatchObject({
        sourcePath: "Takeout/Chrome/BrowserHistory.json",
        errorCode: "source_parse_failed",
        recoverable: true,
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("quarantines a malformed single JSON source during dry-run", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-import-"));
    const badPath = join(dir, "BrowserHistory.json");
    const previewPath = join(dir, "preview.json");

    try {
      await writeFile(badPath, "{", "utf8");

      const result = await runContinuumImportCli([
        "dry-run",
        "google-chrome-history",
        badPath,
        "--out",
        previewPath,
      ]);

      expect(result.command).toBe("dry-run");
      if (result.command !== "dry-run") {
        throw new Error("Expected dry-run result.");
      }
      expect(result.batch.stats.recordsQuarantined).toBe(1);

      const preview = JSON.parse(await readFile(previewPath, "utf8"));
      expect(preview.quarantine[0]).toMatchObject({
        sourcePath: "BrowserHistory.json",
        errorCode: "source_parse_failed",
        recoverable: true,
      });
      expect(preview.sourceFiles).toEqual([
        {
          path: "BrowserHistory.json",
          source: "google-chrome-history",
          status: "invalid",
          eventsCreated: 0,
          quarantineRecords: 1,
        },
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
