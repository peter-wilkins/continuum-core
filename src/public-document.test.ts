import publicDocumentFixture from "./fixtures/project-gutenberg-analytical-engine-public-document.json" with {
  type: "json",
};
import { describe, expect, it } from "vitest";

import {
  normalizePublicDocument,
  parsePublicDocument,
  type PublicDocumentNormalizationInput,
} from "./index";

describe("public document import", () => {
  it("imports one public-domain document into the canonical event model", () => {
    const event = normalizePublicDocument(
      publicDocumentFixture as PublicDocumentNormalizationInput,
    );

    expect(event).toMatchObject({
      id: "public_archive:project_gutenberg:75107",
      source: {
        platform: "public_archive",
        key: "public_archive:project_gutenberg:75107",
        externalConversationId: "project_gutenberg:75107",
        externalMessageId: "75107",
        artifactId: "https://www.gutenberg.org/files/75107/75107-h/75107-h.htm",
        externalParentId: null,
        canonicalParentEventId: null,
      },
      provenance: {
        sourceFamily: "public_archive",
        sourceName: "project_gutenberg",
        upstreamSources: ["scientific_memoirs_volume_3_1843"],
        derivedFrom: [],
        retrievedAt: "2026-05-22T11:55:00.000Z",
        license: "Public domain in the USA.",
      },
      time: {
        createdAt: "1843-01-01T00:00:00.000Z",
        createdAtConfidence: "inferred",
      },
      actor: {
        role: "other",
      },
      participants: [
        {
          role: "author",
          name: "Luigi Federico Menabrea",
          address: "Luigi Federico Menabrea",
        },
        {
          role: "translator",
          name: "Ada Lovelace",
          address: "Ada Lovelace",
        },
      ],
      content: {
        kind: "text",
        subject: "Sketch of the Analytical Engine invented by Charles Babbage, Esq.",
        text: "In studying the action of the Analytical Engine, operations are distinguished from the objects operated upon.",
      },
    });
    expect(event.source.fingerprint).toMatch(/^[0-9a-f]{16}$/);
  });

  it("rejects public documents without explicit license metadata", () => {
    const result = parsePublicDocument({
      ...publicDocumentFixture,
      source: {
        ...publicDocumentFixture.source,
        license: "",
      },
    });

    expect(result.ok).toBe(false);
  });
});
