import { describe, expect, it } from "vitest";

import { createSourceParagraph } from "./index";

const validSourceParagraphInput = {
  id: "source-paragraph:public_archive:project_gutenberg:75107:0",
  canonicalEventId: "public_archive:project_gutenberg:75107",
  documentId: "source-document:project_gutenberg:75107",
  paragraphIndex: 0,
  sourceFingerprint: "abc123def4567890",
  text: "In studying the action of the Analytical Engine, operations are distinguished from the objects operated upon.",
  context: {
    title: "Sketch of the Analytical Engine invented by Charles Babbage, Esq.",
    sourceName: "project_gutenberg",
    sourceRecordId: "75107",
    sourceUrl: "https://www.gutenberg.org/files/75107/75107-h/75107-h.htm",
    license: "Public domain in the USA.",
    retrievedAt: "2026-05-22T11:55:00.000Z",
    parserVersion: "public-document:v1",
  },
};

describe("Source Paragraphs", () => {
  it("creates one Source Paragraph with a paragraph locator", () => {
    const paragraph = createSourceParagraph(validSourceParagraphInput);

    expect(paragraph).toMatchObject({
      id: "source-paragraph:public_archive:project_gutenberg:75107:0",
      canonicalEventId: "public_archive:project_gutenberg:75107",
      documentId: "source-document:project_gutenberg:75107",
      paragraphIndex: 0,
      sourceFingerprint: "abc123def4567890",
      text: "In studying the action of the Analytical Engine, operations are distinguished from the objects operated upon.",
      context: {
        title: "Sketch of the Analytical Engine invented by Charles Babbage, Esq.",
        sourceName: "project_gutenberg",
        sourceRecordId: "75107",
        sourceUrl: "https://www.gutenberg.org/files/75107/75107-h/75107-h.htm",
        license: "Public domain in the USA.",
        retrievedAt: "2026-05-22T11:55:00.000Z",
        parserVersion: "public-document:v1",
      },
    });
  });

  it("rejects blank Source Paragraph text", () => {
    expect(() =>
      createSourceParagraph({
        ...validSourceParagraphInput,
        text: " ",
      }),
    ).toThrow("SourceParagraph text must not be blank.");
  });

  it("rejects negative and non-integer Source Paragraph indexes", () => {
    expect(() =>
      createSourceParagraph({
        ...validSourceParagraphInput,
        paragraphIndex: -1,
      }),
    ).toThrow("SourceParagraph paragraphIndex must be a non-negative integer.");

    expect(() =>
      createSourceParagraph({
        ...validSourceParagraphInput,
        paragraphIndex: 1.5,
      }),
    ).toThrow("SourceParagraph paragraphIndex must be a non-negative integer.");
  });
});
