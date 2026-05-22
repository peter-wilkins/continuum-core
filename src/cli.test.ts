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
const calendarFixturePath = fileURLToPath(
  new URL("./fixtures/calendar-one-event.ics", import.meta.url),
);
const markdownFixturePath = fileURLToPath(
  new URL("./fixtures/markdown-one-note.md", import.meta.url),
);
const gitFixturePath = fileURLToPath(
  new URL("./fixtures/git-one-commit.txt", import.meta.url),
);
const mediawikiFixturePath = fileURLToPath(
  new URL("./fixtures/mediawiki-one-revision.json", import.meta.url),
);
const wikidataFixturePath = fileURLToPath(
  new URL("./fixtures/wikidata-ada-lovelace-entity.json", import.meta.url),
);
const publicDocumentFixturePath = fileURLToPath(
  new URL(
    "./fixtures/project-gutenberg-analytical-engine-public-document.json",
    import.meta.url,
  ),
);
const adaImportScopeFixturePath = fileURLToPath(
  new URL("./fixtures/import-scope-ada-lovelace-computing.json", import.meta.url),
);
const emailMboxFixturePath = fileURLToPath(
  new URL("./fixtures/email-one-message.mbox", import.meta.url),
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
          importScope: null,
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
        filterSummary: {
          included: 1,
          excluded: 0,
          needsReview: 1,
          reasons: {
            strong_user_intent: 1,
            weak_passive_activity: 1,
          },
        },
      }),
    ).toBe(
      "Preview written to /tmp/preview.json\nReport new=2 known=0 changed=0 uncertain=0 quarantined=0 warnings=1 sourceFiles=3 included=1 excluded=0 needsReview=1\n",
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
      expect(result.batch.importScope).toBeNull();
      expect(result.batch.stats.recordsSeen).toBe(2);
      expect(result.batch.stats.eventsCreated).toBe(2);
      expect(result.batch.stats.recordsQuarantined).toBe(0);

      const preview = JSON.parse(await readFile(previewPath, "utf8"));

      expect(preview.batch.importScope).toBeNull();
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
      expect(result.filterSummary).toEqual({
        included: 3,
        excluded: 0,
        needsReview: 2,
        reasons: {
          strong_user_intent: 3,
          weak_passive_activity: 2,
        },
      });

      const preview = JSON.parse(await readFile(previewPath, "utf8"));
      expect(preview.filterSummary).toEqual(result.filterSummary);
      expect(preview.events).toHaveLength(5);
      expect(preview.events.map((event: { platform: string }) => event.platform)).toEqual([
        "google_chrome",
        "google_chrome",
        "google_activity",
        "google_activity",
        "google_activity",
      ]);
      expect(
        preview.events.map(
          (event: {
            subject: string | null;
            filterDecision: { action: string; reason: string };
            memoryActive: boolean;
          }) => ({
            subject: event.subject,
            action: event.filterDecision.action,
            reason: event.filterDecision.reason,
            memoryActive: event.memoryActive,
          }),
        ),
      ).toEqual([
        {
          subject: "Continuum core",
          action: "include",
          reason: "strong_user_intent",
          memoryActive: true,
        },
        {
          subject: "Continuum core issue tracker",
          action: "needs_review",
          reason: "weak_passive_activity",
          memoryActive: false,
        },
        {
          subject: "Watched TypeScript Tutorial",
          action: "needs_review",
          reason: "weak_passive_activity",
          memoryActive: false,
        },
        {
          subject: "Searched for canonical event schema",
          action: "include",
          reason: "strong_user_intent",
          memoryActive: true,
        },
        {
          subject: "Searched for coffee near me",
          action: "include",
          reason: "strong_user_intent",
          memoryActive: true,
        },
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

  it("quarantines a Google Takeout zip record with an invalid time", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-takeout-"));
    const zipPath = join(dir, "takeout.zip");
    const previewPath = join(dir, "preview.json");

    try {
      const bookmarks = await readFile(chromeBookmarksFixturePath, "utf8");
      const invalidBookmark =
        '<DT><A HREF="https://example.com/bad-date" ADD_DATE="not-a-date">Bad date</A>';
      const zipped = zipSync({
        "Takeout/Chrome/Bookmarks.html": strToU8(
          bookmarks.replace("</DL><p>", `${invalidBookmark}\n</DL><p>`),
        ),
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
      expect(result.batch.stats.recordsSeen).toBe(2);
      expect(result.batch.stats.eventsCreated).toBe(1);
      expect(result.batch.stats.recordsQuarantined).toBe(1);

      const preview = JSON.parse(await readFile(previewPath, "utf8"));
      expect(preview.sourceFiles).toEqual([
        {
          path: "Takeout/Chrome/Bookmarks.html",
          source: "google-chrome-bookmarks",
          status: "invalid",
          eventsCreated: 1,
          quarantineRecords: 1,
        },
      ]);
      expect(preview.quarantine[0]).toMatchObject({
        sourcePath: "Takeout/Chrome/Bookmarks.html",
        recordIndex: 1,
        errorCode: "source_normalization_failed",
        recoverable: true,
      });
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

  it("quarantines a malformed Google Takeout zip during dry-run", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-takeout-"));
    const zipPath = join(dir, "takeout.zip");
    const previewPath = join(dir, "preview.json");

    try {
      await writeFile(zipPath, "not a zip", "utf8");

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
      expect(result.batch.stats.recordsQuarantined).toBe(1);

      const preview = JSON.parse(await readFile(previewPath, "utf8"));
      expect(preview.quarantine[0]).toMatchObject({
        sourcePath: "takeout.zip",
        errorCode: "source_parse_failed",
        recoverable: true,
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("quarantines an invalid iCalendar date inside a Google Takeout zip", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-takeout-"));
    const zipPath = join(dir, "takeout.zip");
    const previewPath = join(dir, "preview.json");

    try {
      const zipped = zipSync({
        "Takeout/Calendar/calendar.ics": strToU8(
          [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "BEGIN:VEVENT",
            "UID:bad-date",
            "DTSTART:not-a-date",
            "SUMMARY:Bad calendar date",
            "END:VEVENT",
            "BEGIN:VEVENT",
            "UID:good-date",
            "DTSTART:20260521T104203Z",
            "SUMMARY:Good calendar date",
            "END:VEVENT",
            "END:VCALENDAR",
          ].join("\n"),
        ),
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
      expect(result.batch.stats.recordsSeen).toBe(2);
      expect(result.batch.stats.eventsCreated).toBe(1);
      expect(result.batch.stats.recordsQuarantined).toBe(1);

      const preview = JSON.parse(await readFile(previewPath, "utf8"));
      expect(preview.sourceFiles).toEqual([
        {
          path: "Takeout/Calendar/calendar.ics",
          source: "icalendar",
          status: "invalid",
          eventsCreated: 1,
          quarantineRecords: 1,
        },
      ]);
      expect(preview.quarantine[0]).toMatchObject({
        sourcePath: "Takeout/Calendar/calendar.ics",
        recordIndex: 0,
        errorCode: "source_normalization_failed",
        recoverable: true,
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("imports an iCalendar file through the CLI", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-import-"));
    const outputPath = join(dir, "events.jsonl");

    try {
      const result = await runContinuumImportCli([
        "icalendar",
        calendarFixturePath,
        "--out",
        outputPath,
      ]);

      expect(result).toMatchObject({
        command: "import",
        eventsWritten: 1,
        warnings: 0,
      });

      const lines = (await readFile(outputPath, "utf8")).trim().split("\n");
      expect(lines).toHaveLength(1);
      expect(JSON.parse(lines[0] ?? "{}")).toMatchObject({
        source: {
          platform: "icalendar",
          externalConversationId: "calendar-one-event.ics",
          externalMessageId: "boiler-quote@example.com",
        },
        content: {
          subject: "Boiler quote call",
        },
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("imports one MBOX email through the CLI", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-import-"));
    const outputPath = join(dir, "events.jsonl");

    try {
      const result = await runContinuumImportCli([
        "email-mbox",
        emailMboxFixturePath,
        "--out",
        outputPath,
      ]);

      expect(result).toMatchObject({
        command: "import",
        eventsWritten: 1,
        warnings: 0,
        quarantine: [],
      });

      const lines = (await readFile(outputPath, "utf8")).trim().split("\n");
      expect(lines).toHaveLength(1);
      expect(JSON.parse(lines[0] ?? "{}")).toMatchObject({
        source: {
          platform: "email",
          externalMessageId: "<quote-456@example.com>",
          externalConversationId: "<quote-123@example.com>",
        },
        content: {
          subject: "Boiler quote",
          text: "Need to quote Bob for the boiler.",
        },
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("dry-runs one MBOX email through the CLI", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-import-"));
    const previewPath = join(dir, "preview.json");

    try {
      const result = await runContinuumImportCli([
        "dry-run",
        "email-mbox",
        emailMboxFixturePath,
        "--out",
        previewPath,
      ]);

      expect(result.command).toBe("dry-run");
      if (result.command !== "dry-run") {
        throw new Error("Expected dry-run result.");
      }
      expect(result.batch.stats.recordsSeen).toBe(1);
      expect(result.quarantine).toEqual([]);

      const preview = JSON.parse(await readFile(previewPath, "utf8"));
      expect(preview.events).toMatchObject([
        {
          platform: "email",
          subject: "Boiler quote",
        },
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("quarantines malformed MBOX email during dry-run", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-import-"));
    const inputPath = join(dir, "broken.mbox");
    const previewPath = join(dir, "preview.json");

    try {
      await writeFile(
        inputPath,
        [
          "From bad@example.com Thu May 21 10:42:03 2026",
          "Date: not a date",
          "From: Bad <bad@example.com>",
          "Subject: Broken",
          "",
          "No Message-ID here.",
        ].join("\n"),
      );

      const result = await runContinuumImportCli([
        "dry-run",
        "email-mbox",
        inputPath,
        "--out",
        previewPath,
      ]);

      expect(result.command).toBe("dry-run");
      if (result.command !== "dry-run") {
        throw new Error("Expected dry-run result.");
      }
      expect(result.quarantine).toHaveLength(1);
      expect(result.batch.stats.recordsQuarantined).toBe(1);
      expect(result.batch.stats.eventsCreated).toBe(0);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("inspects one MBOX email through the CLI without loading the whole file as text", async () => {
    const result = await runContinuumImportCli([
      "inspect",
      "email-mbox",
      emailMboxFixturePath,
    ]);

    expect(result).toMatchObject({
      command: "inspect",
      sourcePlatform: "email-mbox",
      recordsSeen: 1,
      importableEvents: 1,
      validationErrors: 0,
      sourceFiles: [
        {
          source: "email-mbox",
          status: "matched",
          eventsCreated: 1,
          quarantineRecords: 0,
        },
      ],
    });
  });

  it("routes iCalendar files inside a Google Takeout zip", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-takeout-"));
    const zipPath = join(dir, "takeout.zip");
    const previewPath = join(dir, "preview.json");

    try {
      const zipped = zipSync({
        "Takeout/Calendar/basic-event.ics": strToU8(
          await readFile(calendarFixturePath, "utf8"),
        ),
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
      expect(result.batch.stats.eventsCreated).toBe(1);

      const preview = JSON.parse(await readFile(previewPath, "utf8"));
      expect(preview.sourceFiles).toEqual([
        {
          path: "Takeout/Calendar/basic-event.ics",
          source: "icalendar",
          status: "matched",
          eventsCreated: 1,
          quarantineRecords: 0,
        },
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("imports a Markdown file through the CLI", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-import-"));
    const outputPath = join(dir, "events.jsonl");

    try {
      const result = await runContinuumImportCli([
        "markdown",
        markdownFixturePath,
        "--out",
        outputPath,
      ]);

      expect(result).toMatchObject({
        command: "import",
        eventsWritten: 1,
        warnings: 0,
      });

      const lines = (await readFile(outputPath, "utf8")).trim().split("\n");
      expect(lines).toHaveLength(1);
      expect(JSON.parse(lines[0] ?? "{}")).toMatchObject({
        source: {
          platform: "markdown",
          externalConversationId: "markdown-one-note.md",
        },
        content: {
          subject: "Boiler notes",
        },
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("imports a MediaWiki revision file through the CLI", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-import-"));
    const outputPath = join(dir, "events.jsonl");

    try {
      const result = await runContinuumImportCli([
        "mediawiki-revisions",
        mediawikiFixturePath,
        "--out",
        outputPath,
      ]);

      expect(result).toMatchObject({
        command: "import",
        eventsWritten: 1,
        warnings: 0,
      });

      const lines = (await readFile(outputPath, "utf8")).trim().split("\n");
      expect(lines).toHaveLength(1);
      expect(JSON.parse(lines[0] ?? "{}")).toMatchObject({
        source: {
          platform: "wikimedia",
          externalConversationId: "en.wikipedia.org:page:12345",
          externalMessageId: "67890",
        },
        content: {
          subject: "Boiler",
          text: "Add maintenance note",
        },
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("imports a Wikidata entity file through the CLI", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-import-"));
    const outputPath = join(dir, "events.jsonl");

    try {
      const result = await runContinuumImportCli([
        "wikidata-entity",
        wikidataFixturePath,
        "--out",
        outputPath,
      ]);

      expect(result).toMatchObject({
        command: "import",
        eventsWritten: 1,
        warnings: 0,
      });

      const lines = (await readFile(outputPath, "utf8")).trim().split("\n");
      expect(lines).toHaveLength(1);
      expect(JSON.parse(lines[0] ?? "{}")).toMatchObject({
        source: {
          platform: "wikimedia",
          externalConversationId: "wikidata:Q7259",
          externalMessageId: "2495481811",
        },
        provenance: {
          sourceFamily: "wikimedia",
          sourceName: "wikidata",
        },
        content: {
          subject: "Ada Lovelace",
        },
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("imports a public document through the CLI", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-import-"));
    const outputPath = join(dir, "events.jsonl");

    try {
      const result = await runContinuumImportCli([
        "public-document",
        publicDocumentFixturePath,
        "--out",
        outputPath,
      ]);

      expect(result).toMatchObject({
        command: "import",
        eventsWritten: 1,
        warnings: 0,
      });

      const lines = (await readFile(outputPath, "utf8")).trim().split("\n");
      expect(lines).toHaveLength(1);
      expect(JSON.parse(lines[0] ?? "{}")).toMatchObject({
        source: {
          platform: "public_archive",
          externalConversationId: "project_gutenberg:75107",
          externalMessageId: "75107",
        },
        provenance: {
          sourceFamily: "public_archive",
          sourceName: "project_gutenberg",
        },
        content: {
          subject: "Sketch of the Analytical Engine invented by Charles Babbage, Esq.",
        },
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("dry-runs a public document with an explicit Import Scope", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-import-"));
    const previewPath = join(dir, "preview.json");

    try {
      const result = await runContinuumImportCli([
        "dry-run",
        "public-document",
        publicDocumentFixturePath,
        "--scope",
        adaImportScopeFixturePath,
        "--out",
        previewPath,
      ]);

      expect(result.command).toBe("dry-run");
      if (result.command !== "dry-run") {
        throw new Error("Expected dry-run result.");
      }
      expect(result.batch.importScope).toMatchObject({
        id: "scope:ada-lovelace-through-computing",
        primaryEntity: {
          label: "Ada Lovelace",
        },
        focusEntity: {
          label: "computing",
        },
      });
      expect(result.filterSummary).toMatchObject({
        included: 1,
        excluded: 0,
        needsReview: 0,
        reasons: {
          primary_and_focus_match: 1,
        },
      });

      const preview = JSON.parse(await readFile(previewPath, "utf8"));
      expect(preview.batch.importScope.id).toBe(
        "scope:ada-lovelace-through-computing",
      );
      expect(preview.events[0].filterDecision).toMatchObject({
        action: "include",
        reason: "primary_and_focus_match",
        confidence: 1,
      });
      expect(preview.events[0].memoryActive).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("routes Markdown files inside a Google Takeout zip", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-takeout-"));
    const zipPath = join(dir, "takeout.zip");
    const previewPath = join(dir, "preview.json");

    try {
      const zipped = zipSync({
        "Takeout/Keep/boiler.md": strToU8(
          await readFile(markdownFixturePath, "utf8"),
        ),
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
      expect(result.batch.stats.eventsCreated).toBe(1);

      const preview = JSON.parse(await readFile(previewPath, "utf8"));
      expect(preview.sourceFiles).toEqual([
        {
          path: "Takeout/Keep/boiler.md",
          source: "markdown",
          status: "matched",
          eventsCreated: 1,
          quarantineRecords: 0,
        },
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("dry-runs a MediaWiki revision through CLI", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-import-"));
    const outputPath = join(dir, "preview.json");

    try {
      const result = await runContinuumImportCli([
        "dry-run",
        "mediawiki-revisions",
        mediawikiFixturePath,
        "--out",
        outputPath,
      ]);

      expect(result.command).toBe("dry-run");
      if (result.command !== "dry-run") {
        throw new Error("Expected dry-run result.");
      }
      expect(result.batch.stats.eventsCreated).toBe(1);
      expect(result.batch.stats.recordsQuarantined).toBe(0);

      const preview = JSON.parse(await readFile(outputPath, "utf8"));
      expect(preview.sourceFiles).toEqual([
        {
          path: "mediawiki-one-revision.json",
          source: "mediawiki-revisions",
          status: "matched",
          eventsCreated: 1,
          quarantineRecords: 0,
        },
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("quarantines malformed MediaWiki JSON during dry-run", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-import-"));
    const badPath = join(dir, "bad-mediawiki.json");
    const previewPath = join(dir, "preview.json");

    try {
      await writeFile(badPath, "{", "utf8");

      const result = await runContinuumImportCli([
        "dry-run",
        "mediawiki-revisions",
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
        sourcePath: "bad-mediawiki.json",
        errorCode: "source_parse_failed",
        recoverable: true,
      });
      expect(preview.sourceFiles).toEqual([
        {
          path: "bad-mediawiki.json",
          source: "mediawiki-revisions",
          status: "invalid",
          eventsCreated: 0,
          quarantineRecords: 1,
        },
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("routes MediaWiki files inside a Google Takeout zip", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-takeout-"));
    const zipPath = join(dir, "takeout.zip");
    const previewPath = join(dir, "preview.json");
    const boilerMediaWikiFixture = JSON.parse(
      await readFile(mediawikiFixturePath, "utf8"),
    ) as {
      revision: {
        revid: number;
      };
    };
    boilerMediaWikiFixture.revision.revid = 67891;

    try {
      const zipped = zipSync({
        "Takeout/Wikipedia/page-revisions.json": strToU8(
          await readFile(mediawikiFixturePath, "utf8"),
        ),
        "Takeout/Data/boiler.json": strToU8(
          JSON.stringify(boilerMediaWikiFixture),
        ),
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
      expect(result.batch.stats.eventsCreated).toBe(2);
      expect(result.batch.stats.filesSeen).toBe(2);

      const preview = JSON.parse(await readFile(previewPath, "utf8"));
      expect(preview.sourceFiles).toEqual([
        {
          path: "Takeout/Data/boiler.json",
          source: "mediawiki-revisions",
          status: "matched",
          eventsCreated: 1,
          quarantineRecords: 0,
        },
        {
          path: "Takeout/Wikipedia/page-revisions.json",
          source: "mediawiki-revisions",
          status: "matched",
          eventsCreated: 1,
          quarantineRecords: 0,
        },
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("imports a Git log file through the CLI", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-import-"));
    const outputPath = join(dir, "events.jsonl");

    try {
      const result = await runContinuumImportCli([
        "git-log",
        gitFixturePath,
        "--out",
        outputPath,
      ]);

      expect(result).toMatchObject({
        command: "import",
        eventsWritten: 1,
        warnings: 0,
      });

      const lines = (await readFile(outputPath, "utf8")).trim().split("\n");
      expect(lines).toHaveLength(1);
      expect(JSON.parse(lines[0] ?? "{}")).toMatchObject({
        source: {
          platform: "git",
          externalConversationId: "git-one-commit.txt",
          externalMessageId: "db3c0f9cbbfd5909040b86afff175a2b96732898",
        },
        participants: [
          {
            role: "author",
            address: "poppetew@gmail.com",
          },
        ],
        content: {
          subject: "Pressure test model with Wikimedia",
        },
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("routes Git log files inside a Google Takeout zip", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-takeout-"));
    const zipPath = join(dir, "takeout.zip");
    const previewPath = join(dir, "preview.json");

    try {
      const zipped = zipSync({
        "Takeout/Git/continuum-core.gitlog": strToU8(
          await readFile(gitFixturePath, "utf8"),
        ),
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
      expect(result.batch.stats.eventsCreated).toBe(1);

      const preview = JSON.parse(await readFile(previewPath, "utf8"));
      expect(preview.sourceFiles).toEqual([
        {
          path: "Takeout/Git/continuum-core.gitlog",
          source: "git-log",
          status: "matched",
          eventsCreated: 1,
          quarantineRecords: 0,
        },
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("quarantines a malformed Git log during dry-run", async () => {
    const dir = await mkdtemp(join(tmpdir(), "continuum-import-"));
    const badPath = join(dir, "bad.gitlog");
    const previewPath = join(dir, "preview.json");

    try {
      await writeFile(badPath, "Author: Peter Wilkins <poppetew@gmail.com>", "utf8");

      const result = await runContinuumImportCli([
        "dry-run",
        "git-log",
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
        sourcePath: "commit.0.hash",
        errorCode: "source_validation_failed",
        recoverable: true,
      });
      expect(preview.sourceFiles).toEqual([
        {
          path: "bad.gitlog",
          source: "git-log",
          status: "invalid",
          eventsCreated: 0,
          quarantineRecords: 1,
        },
      ]);
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
