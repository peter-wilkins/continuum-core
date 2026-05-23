import { describe, expect, it } from "vitest";

import {
  createDefaultPublicLinesOfInquiry,
  createThoughtCard,
  type PublicContinuumQuery,
} from "./index";

const query: PublicContinuumQuery = {
  id: "query:extended-thought-seed",
  scopeId: "scope:extended-thought-brain-augmentation",
  text: "How have people tried to extend thought?",
  origin: "system_seed",
  createdAt: "2026-05-23T08:25:00.000Z",
};

describe("public Lines of Inquiry", () => {
  it("generates a recommended Line of Inquiry from Thought Cards with Source Support", () => {
    const generatedAt = "2026-05-23T10:45:00.000Z";
    const cards = [
      createThoughtCard({
        id: "thought-card:lens-output:extended-thought:atlas:v1:0",
        lensOutputId: "lens-output:extended-thought:atlas:v1",
        title: "Intelligence amplification uses computers",
        body: "Intelligence amplification uses computers to extend thought.",
        sourceParagraphIds: ["source-paragraph:wikimedia:wikipedia:1:0"],
        confidence: 1,
        generatedAt,
      }),
      createThoughtCard({
        id: "thought-card:lens-output:extended-thought:beacon:v1:1",
        lensOutputId: "lens-output:extended-thought:beacon:v1",
        title: "Brain-computer interfaces connect signals",
        body: "Brain-computer interfaces connect brain signals to tools.",
        sourceParagraphIds: ["source-paragraph:wikimedia:wikipedia:2:0"],
        confidence: 0.9,
        generatedAt,
      }),
    ];

    const inquiry = createDefaultPublicLinesOfInquiry(
      query,
      cards,
      generatedAt,
    );

    expect(inquiry).toMatchObject({
      queryId: "query:extended-thought-seed",
      recommendedLineId:
        "line-of-inquiry:query:extended-thought-seed:core_claim:v1",
      lines: [
        {
          id: "line-of-inquiry:query:extended-thought-seed:core_claim:v1",
          title: "Name the core claim",
          question:
            "What is the strongest source-backed claim about how people extend thought?",
          desiredOutcome: "A one-sentence claim that can be tested against the sources.",
          synthesisMove: "core_claim",
          recommended: true,
          sourceSupport: [
            {
              thoughtCardId: "thought-card:lens-output:extended-thought:atlas:v1:0",
              sourceParagraphIds: ["source-paragraph:wikimedia:wikipedia:1:0"],
            },
            {
              thoughtCardId: "thought-card:lens-output:extended-thought:beacon:v1:1",
              sourceParagraphIds: ["source-paragraph:wikimedia:wikipedia:2:0"],
            },
          ],
          whyThis: {
            synthesisMove: "core_claim",
            explanation:
              "This line turns source-backed thoughts into the main claim to test next.",
          },
        },
        {
          synthesisMove: "tension",
          recommended: false,
        },
        {
          synthesisMove: "next_question",
          recommended: false,
        },
      ],
    });
  });

  it("rejects Line generation without source-backed Thought Cards", () => {
    expect(() =>
      createDefaultPublicLinesOfInquiry(
        query,
        [],
        "2026-05-23T10:45:00.000Z",
      ),
    ).toThrow(
      "Default public Lines of Inquiry require at least one source-backed Thought Card.",
    );
  });
});
