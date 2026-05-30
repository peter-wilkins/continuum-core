import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  normalizeWebFeedExport,
  normalizeWebFeedItem,
  parseWebFeedExport,
  type WebFeedItemNormalizationInput,
} from "./index";

const rssFixture = readFileSync(
  fileURLToPath(new URL("./fixtures/rss-one-item.xml", import.meta.url)),
  "utf8",
);

describe("RSS and Atom feed import", () => {
  it("parses one RSS feed item", () => {
    expect(parseWebFeedExport(rssFixture)).toEqual({
      ok: true,
      value: {
        feedTitle: "Continuum Notes",
        items: [
          {
            feedTitle: "Continuum Notes",
            title: "Extended thought needs receipts",
            url: "https://example.test/extended-thought-receipts",
            id: "continuum-notes-001",
            publishedAt: "2026-05-21T10:42:03.000Z",
            summary: "Short notes should stay connected to evidence.",
          },
        ],
      },
    });
  });

  it("imports one RSS feed item into the canonical event model", () => {
    const parsed = parseWebFeedExport(rssFixture);

    if (!parsed.ok) {
      throw new Error("Fixture should parse.");
    }

    const event = normalizeWebFeedItem({
      feedPath: "feeds/continuum-notes.xml",
      retrievedAt: "2026-05-30T12:00:00.000Z",
      retrievedAtConfidence: "exact",
      item: parsed.value.items[0],
    } as WebFeedItemNormalizationInput);

    expect(event).toMatchObject({
      id: "rss:continuum-notes-001",
      source: {
        platform: "rss",
        key: "rss:continuum-notes-001",
        externalConversationId: "Continuum Notes",
        externalMessageId: "continuum-notes-001",
        artifactId: "https://example.test/extended-thought-receipts",
        externalParentId: null,
        canonicalParentEventId: null,
      },
      provenance: {
        sourceFamily: "web_feed",
        sourceName: "rss_atom_feed",
        upstreamSources: [],
        derivedFrom: [],
        retrievedAt: "2026-05-30T12:00:00.000Z",
        license: null,
      },
      time: {
        createdAt: "2026-05-21T10:42:03.000Z",
        createdAtConfidence: "exact",
      },
      actor: {
        role: "other",
      },
      participants: [],
      content: {
        kind: "text",
        subject: "Extended thought needs receipts",
        text: [
          "Continuum Notes",
          "Extended thought needs receipts",
          "https://example.test/extended-thought-receipts",
          "Short notes should stay connected to evidence.",
        ].join("\n"),
      },
    });
    expect(event.source.fingerprint).toMatch(/^[0-9a-f]{16}$/);
  });

  it("normalizes a web feed export", () => {
    const parsed = parseWebFeedExport(rssFixture);

    if (!parsed.ok) {
      throw new Error("Fixture should parse.");
    }

    const events = normalizeWebFeedExport(parsed.value, {
      feedPath: "feeds/continuum-notes.xml",
      retrievedAt: "2026-05-30T12:00:00.000Z",
      retrievedAtConfidence: "exact",
    });

    expect(events).toHaveLength(1);
    expect(events[0]?.source.platform).toBe("rss");
    expect(events[0]?.content.subject).toBe("Extended thought needs receipts");
  });

  it("rejects XML without RSS items or Atom entries", () => {
    expect(parseWebFeedExport("<feed><title>Empty</title></feed>")).toEqual({
      ok: false,
      errors: [
        {
          path: "items",
          message: "No RSS item or Atom entry records found",
        },
      ],
    });
  });
});
