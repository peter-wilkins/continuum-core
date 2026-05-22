import { describe, expect, it } from "vitest";
import publicDocumentFixture from "./fixtures/project-gutenberg-analytical-engine-public-document.json" with {
  type: "json",
};

import {
  createDefaultPublicThoughtCards,
  createLensOutput,
  createThoughtCard,
  extractSourceParagraphsFromPublicDocument,
  type PublicDocumentNormalizationInput,
} from "./index";

const validThoughtCardInput = {
  id: "thought-card:lens-output:ada-computing:atlas:v1:0",
  lensOutputId: "lens-output:ada-computing:atlas:v1",
  title: "Operations and objects are distinct",
  body: "Ada Lovelace's translated note separates operations from the things operated on, which is a core early-computing idea.",
  sourceParagraphIds: [
    "source-paragraph:public_archive:project_gutenberg:75107:0",
  ],
  confidence: 0.86,
  generatedAt: "2026-05-22T12:30:00.000Z",
};

describe("Thought Cards", () => {
  it("creates one Thought Card from Source Paragraph references", () => {
    const card = createThoughtCard(validThoughtCardInput);

    expect(card).toMatchObject({
      id: "thought-card:lens-output:ada-computing:atlas:v1:0",
      lensOutputId: "lens-output:ada-computing:atlas:v1",
      title: "Operations and objects are distinct",
      body: "Ada Lovelace's translated note separates operations from the things operated on, which is a core early-computing idea.",
      sourceParagraphIds: [
        "source-paragraph:public_archive:project_gutenberg:75107:0",
      ],
      confidence: 0.86,
      generatedAt: "2026-05-22T12:30:00.000Z",
    });
  });

  it("rejects a Thought Card with no Source Paragraph ids", () => {
    expect(() =>
      createThoughtCard({
        ...validThoughtCardInput,
        sourceParagraphIds: [],
      }),
    ).toThrow(
      "ThoughtCard sourceParagraphIds must contain at least one Source Paragraph id.",
    );
  });

  it("rejects blank generated Thought Card display text", () => {
    expect(() =>
      createThoughtCard({
        ...validThoughtCardInput,
        title: " ",
      }),
    ).toThrow("ThoughtCard title must not be blank.");

    expect(() =>
      createThoughtCard({
        ...validThoughtCardInput,
        body: " ",
      }),
    ).toThrow("ThoughtCard body must not be blank.");
  });

  it("rejects invalid Thought Card confidence and generation time", () => {
    expect(() =>
      createThoughtCard({
        ...validThoughtCardInput,
        confidence: 1.5,
      }),
    ).toThrow("Confidence must be a finite number from 0 to 1.");

    expect(() =>
      createThoughtCard({
        ...validThoughtCardInput,
        generatedAt: "not-a-date",
      }),
    ).toThrow("ThoughtCard generatedAt must be an ISO-compatible date.");
  });

  it("creates default public Thought Cards from Source Paragraphs", () => {
    const publicDocument = {
      ...publicDocumentFixture,
      document: {
        ...publicDocumentFixture.document,
        text: [
          "In studying the action of the Analytical Engine, operations are distinguished from the objects operated upon.",
          "",
          "The engine may act upon other things besides number, were objects found whose mutual fundamental relations could be expressed by those of the abstract science of operations.",
        ].join("\n"),
      },
    } as PublicDocumentNormalizationInput;
    const sourceParagraphs =
      extractSourceParagraphsFromPublicDocument(publicDocument);
    const lensOutput = createLensOutput({
      id: "lens-output:ada-computing:atlas:v1",
      scopeId: "scope:ada-lovelace-through-computing",
      queryId: "query:ada-lovelace-contribution",
      lensId: "atlas",
      lensVersion: "1.0.0",
      generatedAt: "2026-05-22T12:30:00.000Z",
      sourceEventIds: ["public_archive:project_gutenberg:75107"],
      sections: [
        {
          id: "atlas:source-text",
          title: "Source Text",
          eventIds: ["public_archive:project_gutenberg:75107"],
        },
      ],
      generation: {
        strategy: "deterministic_fixture",
        model: null,
        parameters: [],
      },
    });

    const cards = createDefaultPublicThoughtCards(lensOutput, sourceParagraphs);

    expect(cards).toHaveLength(2);
    expect(cards.map((card) => card.id)).toEqual([
      "thought-card:lens-output:ada-computing:atlas:v1:0",
      "thought-card:lens-output:ada-computing:atlas:v1:1",
    ]);
    expect(cards[0]).toMatchObject({
      lensOutputId: "lens-output:ada-computing:atlas:v1",
      sourceParagraphIds: [
        "source-paragraph:public_archive:project_gutenberg:75107:0",
      ],
      body: "In studying the action of the Analytical Engine, operations are distinguished from the objects operated upon.",
      confidence: 1,
      generatedAt: "2026-05-22T12:30:00.000Z",
    });
    expect(cards[0]?.title).toContain("Analytical Engine");
    expect(createDefaultPublicThoughtCards(lensOutput, sourceParagraphs)).toEqual(
      cards,
    );
  });

  it("rejects default public Thought Card generation without matching Source Paragraphs", () => {
    const lensOutput = createLensOutput({
      id: "lens-output:ada-computing:atlas:v1",
      scopeId: "scope:ada-lovelace-through-computing",
      queryId: "query:ada-lovelace-contribution",
      lensId: "atlas",
      lensVersion: "1.0.0",
      generatedAt: "2026-05-22T12:30:00.000Z",
      sourceEventIds: ["public_archive:project_gutenberg:75107"],
      sections: [
        {
          id: "atlas:source-text",
          title: "Source Text",
          eventIds: ["public_archive:project_gutenberg:75107"],
        },
      ],
      generation: {
        strategy: "deterministic_fixture",
        model: null,
        parameters: [],
      },
    });

    expect(() => createDefaultPublicThoughtCards(lensOutput, [])).toThrow(
      "Default public Thought Cards require at least one Source Paragraph referenced by the Lens output.",
    );
  });
});
