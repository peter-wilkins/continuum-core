import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import chromeHistoryFixture from "./fixtures/google-chrome-history-one-record.json" with {
  type: "json",
};
import myActivityFixture from "./fixtures/google-my-activity-three-records.json" with {
  type: "json",
};

import {
  type GoogleChromeBookmarkNormalizationInput,
  type GoogleChromeHistoryNormalizationInput,
  type GoogleMyActivityNormalizationInput,
  normalizeGoogleChromeBookmarkRecord,
  normalizeGoogleChromeHistoryRecord,
  normalizeGoogleChromeReadingListRecord,
  normalizeGoogleMyActivityExport,
  normalizeGoogleMyActivityRecord,
  parseGoogleChromeBookmarksExport,
  parseGoogleChromeHistoryExport,
  parseGoogleChromeReadingListExport,
  parseGoogleMyActivityExport,
} from "./index";

const bookmarksFixture = readFileSync(
  fileURLToPath(
    new URL("./fixtures/google-chrome-bookmarks-one-record.html", import.meta.url),
  ),
  "utf8",
);
const readingListFixture = readFileSync(
  fileURLToPath(
    new URL(
      "./fixtures/google-chrome-reading-list-one-record.html",
      import.meta.url,
    ),
  ),
  "utf8",
);

describe("Google Takeout Chrome history import", () => {
  it("imports one Chrome browser history visit into the canonical event model", () => {
    const event = normalizeGoogleChromeHistoryRecord(
      chromeHistoryFixture as GoogleChromeHistoryNormalizationInput,
    );

    expect(event).toMatchObject({
      id: "google_chrome_history:chrome-client-123:1779360123000000:https://github.com/peter-wilkins/continuum-core/issues",
      source: {
        platform: "google_chrome",
        key: "google_chrome_history:chrome-client-123:1779360123000000:https://github.com/peter-wilkins/continuum-core/issues",
        externalConversationId: "chrome-client-123",
        externalMessageId:
          "chrome-client-123:1779360123000000:https://github.com/peter-wilkins/continuum-core/issues",
        artifactId: "https://github.com/peter-wilkins/continuum-core/issues",
        externalParentId: null,
        canonicalParentEventId: null,
      },
      provenance: {
        sourceFamily: "activity_log",
        sourceName: "google_chrome_history",
        upstreamSources: ["google_takeout"],
        derivedFrom: [],
        retrievedAt: "unknown",
        license: null,
      },
      time: {
        createdAt: "2026-05-21T10:42:03.000Z",
        createdAtConfidence: "exact",
      },
      actor: {
        role: "user",
      },
      participants: [],
      content: {
        kind: "text",
        subject: "Continuum core issue tracker",
        text: "Visited Continuum core issue tracker\nhttps://github.com/peter-wilkins/continuum-core/issues",
      },
    });
    expect(event.source.fingerprint).toMatch(/^[0-9a-f]{16}$/);
  });

  it("validates a Google Takeout Chrome history export before normalization", () => {
    const parsed = parseGoogleChromeHistoryExport({
      "Browser History": [chromeHistoryFixture.history],
    });

    expect(parsed).toEqual({
      ok: true,
      value: {
        "Browser History": [chromeHistoryFixture.history],
      },
    });
  });

  it("rejects encrypted Chrome history placeholders instead of normalizing them", () => {
    const parsed = parseGoogleChromeHistoryExport({
      "Browser History": ["Your data is encrypted and cannot be exported"],
    });

    expect(parsed).toEqual({
      ok: false,
      errors: [
        {
          path: "Browser History.0",
          message: "Invalid input: expected object, received string",
        },
      ],
    });
  });
});

describe("Google Takeout My Activity import", () => {
  it("validates Google My Activity JSON records for YouTube, Search, and Maps", () => {
    expect(parseGoogleMyActivityExport(myActivityFixture)).toEqual({
      ok: true,
      value: myActivityFixture,
    });
  });

  it("imports one YouTube activity record into the canonical event model", () => {
    const event = normalizeGoogleMyActivityRecord({
      activity: myActivityFixture[0],
    } as GoogleMyActivityNormalizationInput);

    expect(event).toMatchObject({
      id: "google_my_activity:YouTube:2026-05-21T10:42:03.000Z:https://www.youtube.com/watch?v=abc123",
      source: {
        platform: "google_activity",
        key: "google_my_activity:YouTube:2026-05-21T10:42:03.000Z:https://www.youtube.com/watch?v=abc123",
        externalConversationId: "YouTube",
        externalMessageId:
          "YouTube:2026-05-21T10:42:03.000Z:https://www.youtube.com/watch?v=abc123",
        artifactId: "https://www.youtube.com/watch?v=abc123",
        externalParentId: null,
        canonicalParentEventId: null,
      },
      provenance: {
        sourceFamily: "activity_log",
        sourceName: "google_my_activity",
        upstreamSources: ["google_takeout"],
        derivedFrom: [],
        retrievedAt: "unknown",
        license: null,
      },
      time: {
        createdAt: "2026-05-21T10:42:03.000Z",
        createdAtConfidence: "exact",
      },
      actor: {
        role: "user",
      },
      participants: [],
      content: {
        kind: "text",
        subject: "Watched TypeScript Tutorial",
        text: [
          "YouTube",
          "Watched TypeScript Tutorial",
          "https://www.youtube.com/watch?v=abc123",
          "Example Channel",
          "Watched a video",
          "From YouTube watch history",
          "YouTube watch history",
        ].join("\n"),
      },
    });
    expect(event.source.fingerprint).toMatch(/^[0-9a-f]{16}$/);
  });

  it("normalizes a mixed My Activity export without special YouTube or Maps adapters", () => {
    const parsed = parseGoogleMyActivityExport(myActivityFixture);

    if (!parsed.ok) {
      throw new Error("Fixture should parse.");
    }

    const events = normalizeGoogleMyActivityExport(parsed.value);

    expect(events.map((event) => event.source.externalConversationId)).toEqual([
      "YouTube",
      "Search",
      "Maps",
    ]);
    expect(events.map((event) => event.source.artifactId)).toEqual([
      "https://www.youtube.com/watch?v=abc123",
      "https://www.google.com/search?q=canonical+event+schema",
      "https://www.google.com/maps/search/coffee",
    ]);
  });

  it("rejects My Activity records without a timestamp", () => {
    expect(
      parseGoogleMyActivityExport([
        {
          header: "YouTube",
          title: "Watched TypeScript Tutorial",
        },
      ]),
    ).toEqual({
      ok: false,
      errors: [
        {
          path: "0.time",
          message: "Invalid input: expected string, received undefined",
        },
      ],
    });
  });
});

describe("Google Takeout Chrome bookmarks import", () => {
  it("parses one Chrome bookmark from the Netscape bookmarks file", () => {
    expect(parseGoogleChromeBookmarksExport(bookmarksFixture)).toEqual({
      ok: true,
      value: {
        bookmarks: [
          {
            title: "Continuum core",
            url: "https://github.com/peter-wilkins/continuum-core",
            addDate: "1779360123",
            iconUri: "https://github.githubassets.com/favicons/favicon.svg",
          },
        ],
      },
    });
  });

  it("imports one Chrome bookmark into the canonical event model", () => {
    const parsed = parseGoogleChromeBookmarksExport(bookmarksFixture);

    if (!parsed.ok) {
      throw new Error("Fixture should parse.");
    }

    const event = normalizeGoogleChromeBookmarkRecord({
      bookmark: parsed.value.bookmarks[0],
    } as GoogleChromeBookmarkNormalizationInput);

    expect(event).toMatchObject({
      id: "google_chrome_bookmark:1779360123:https://github.com/peter-wilkins/continuum-core",
      source: {
        platform: "google_chrome",
        key: "google_chrome_bookmark:1779360123:https://github.com/peter-wilkins/continuum-core",
        externalConversationId: "bookmarks",
        externalMessageId:
          "1779360123:https://github.com/peter-wilkins/continuum-core",
        artifactId: "https://github.com/peter-wilkins/continuum-core",
        externalParentId: null,
        canonicalParentEventId: null,
      },
      provenance: {
        sourceFamily: "saved_references",
        sourceName: "google_chrome_bookmarks",
        upstreamSources: ["google_takeout"],
        derivedFrom: [],
        retrievedAt: "unknown",
        license: null,
      },
      time: {
        createdAt: "2026-05-21T10:42:03.000Z",
        createdAtConfidence: "exact",
      },
      actor: {
        role: "user",
      },
      participants: [],
      content: {
        kind: "text",
        subject: "Continuum core",
        text: "Bookmarked Continuum core\nhttps://github.com/peter-wilkins/continuum-core",
      },
    });
    expect(event.source.fingerprint).toMatch(/^[0-9a-f]{16}$/);
  });

  it("rejects a Chrome bookmarks file with no bookmark links", () => {
    expect(parseGoogleChromeBookmarksExport("<DL><p></DL><p>")).toEqual({
      ok: false,
      errors: [
        {
          path: "bookmarks",
          message: "No bookmark links found",
        },
      ],
    });
  });
});

describe("Google Takeout Chrome reading list import", () => {
  it("parses one Chrome reading list entry from the Netscape bookmarks file", () => {
    expect(parseGoogleChromeReadingListExport(readingListFixture)).toEqual({
      ok: true,
      value: {
        entries: [
          {
            title: "JavaScript reference",
            url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
            addDate: "1779360183",
            iconUri: "https://developer.mozilla.org/favicon.ico",
          },
        ],
      },
    });
  });

  it("imports one Chrome reading list entry into the canonical event model", () => {
    const parsed = parseGoogleChromeReadingListExport(readingListFixture);

    if (!parsed.ok) {
      throw new Error("Fixture should parse.");
    }

    const event = normalizeGoogleChromeReadingListRecord({
      bookmark: parsed.value.entries[0],
    } as GoogleChromeBookmarkNormalizationInput);

    expect(event).toMatchObject({
      id: "google_chrome_reading_list:1779360183:https://developer.mozilla.org/en-US/docs/Web/JavaScript",
      source: {
        platform: "google_chrome",
        key: "google_chrome_reading_list:1779360183:https://developer.mozilla.org/en-US/docs/Web/JavaScript",
        externalConversationId: "reading_list",
        externalMessageId:
          "1779360183:https://developer.mozilla.org/en-US/docs/Web/JavaScript",
        artifactId: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
        externalParentId: null,
        canonicalParentEventId: null,
      },
      provenance: {
        sourceFamily: "saved_references",
        sourceName: "google_chrome_reading_list",
        upstreamSources: ["google_takeout"],
        derivedFrom: [],
        retrievedAt: "unknown",
        license: null,
      },
      time: {
        createdAt: "2026-05-21T10:43:03.000Z",
        createdAtConfidence: "exact",
      },
      actor: {
        role: "user",
      },
      participants: [],
      content: {
        kind: "text",
        subject: "JavaScript reference",
        text: "Saved to reading list JavaScript reference\nhttps://developer.mozilla.org/en-US/docs/Web/JavaScript",
      },
    });
    expect(event.source.fingerprint).toMatch(/^[0-9a-f]{16}$/);
  });
});
