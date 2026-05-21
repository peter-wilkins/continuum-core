import { describe, expect, it } from "vitest";
import chromeHistoryFixture from "./fixtures/google-chrome-history-one-record.json" with {
  type: "json",
};

import {
  type GoogleChromeHistoryNormalizationInput,
  normalizeGoogleChromeHistoryRecord,
  parseGoogleChromeHistoryExport,
} from "./index";

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
