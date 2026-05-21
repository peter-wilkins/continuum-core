import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  normalizeMarkdownDocument,
  type MarkdownDocumentNormalizationInput,
} from "./index";

const markdownFixture = readFileSync(
  fileURLToPath(new URL("./fixtures/markdown-one-note.md", import.meta.url)),
  "utf8",
);

describe("Markdown import", () => {
  it("imports one Markdown document snapshot into the canonical event model", () => {
    const event = normalizeMarkdownDocument({
      file: {
        path: "notes/boiler.md",
        modifiedAt: "2026-05-21T10:42:03.000Z",
      },
      content: markdownFixture,
    } satisfies MarkdownDocumentNormalizationInput);

    expect(event).toMatchObject({
      id: "markdown:notes/boiler.md",
      source: {
        platform: "markdown",
        key: "markdown:notes/boiler.md",
        externalConversationId: "notes/boiler.md",
        externalMessageId: "notes/boiler.md",
        artifactId: "notes/boiler.md",
        externalParentId: null,
        canonicalParentEventId: null,
      },
      provenance: {
        sourceFamily: "local_documents",
        sourceName: "markdown",
        upstreamSources: [],
        derivedFrom: [],
        retrievedAt: "unknown",
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
        subject: "Boiler notes",
        text: "# Boiler notes\n\nAsk Bob whether the boiler is combi or system.",
      },
    });
    expect(event.source.fingerprint).toMatch(/^[0-9a-f]{16}$/);
  });
});
