import { describe, expect, it } from "vitest";

import {
  createDefaultPublicSynthesizedAnswer,
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

describe("public synthesized answers", () => {
  it("synthesizes a short answer from canonical Thought Cards and preserves source support", () => {
    const generatedAt = "2026-05-23T10:30:00.000Z";
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
        id: "thought-card:lens-output:extended-thought:loom:v1:0",
        lensOutputId: "lens-output:extended-thought:loom:v1",
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
      createThoughtCard({
        id: "thought-card:lens-output:extended-thought:beacon:v1:2",
        lensOutputId: "lens-output:extended-thought:beacon:v1",
        title: "== History ==",
        body: "== History == This heading should not become the answer.",
        sourceParagraphIds: ["source-paragraph:wikimedia:wikipedia:3:0"],
        confidence: 0.9,
        generatedAt,
      }),
    ];

    const answer = createDefaultPublicSynthesizedAnswer(
      query,
      cards,
      generatedAt,
    );

    expect(answer).toEqual({
      id: "synthesized-answer:query:extended-thought-seed:default:v1",
      queryId: "query:extended-thought-seed",
      status: "answered",
      answer:
        "The sources point to intelligence amplification and brain-computer interfaces as practical ways people extend thought.",
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
      lensOutputIdsForCompare: [
        "lens-output:extended-thought:atlas:v1",
        "lens-output:extended-thought:loom:v1",
        "lens-output:extended-thought:beacon:v1",
      ],
      generatedAt,
      generation: {
        strategy: "default_source_support_summary",
        model: null,
        parameters: [
          {
            key: "support_limit",
            value: "4",
          },
          {
            key: "canonicalization",
            value: "source_paragraph_ids_and_body",
          },
        ],
      },
    });
  });

  it("returns an explicit insufficient-evidence answer when no Thought Cards support the query", () => {
    const answer = createDefaultPublicSynthesizedAnswer(
      query,
      [],
      "2026-05-23T10:30:00.000Z",
    );

    expect(answer).toMatchObject({
      id: "synthesized-answer:query:extended-thought-seed:default:v1",
      queryId: "query:extended-thought-seed",
      status: "insufficient_evidence",
      answer: "I do not have enough source-backed Thought Cards to answer this yet.",
      sourceSupport: [],
      lensOutputIdsForCompare: [],
      generation: {
        strategy: "default_source_support_summary",
        model: null,
      },
    });
  });
});
