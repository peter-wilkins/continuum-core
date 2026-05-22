import { describe, expect, it } from "vitest";

import { createThoughtCard } from "./index";

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
});
