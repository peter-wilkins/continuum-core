import { describe, expect, it } from "vitest";

import {
  createDefaultPublicLinesOfInquiry,
  createDefaultPublicSynthesizedAnswer,
  createThoughtCard,
  createVoiceConversationTurn,
  type PublicContinuumQuery,
} from "./index";

const query: PublicContinuumQuery = {
  id: "query:extended-thought-seed",
  scopeId: "scope:extended-thought-brain-augmentation",
  text: "How have people tried to extend thought?",
  origin: "user",
  createdAt: "2026-05-29T21:20:00.000Z",
};

describe("Voice Conversation Mode", () => {
  it("creates a voice turn with an answer, next question, and no source-truth transcript claim", () => {
    const generatedAt = "2026-05-29T21:21:00.000Z";
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
    const synthesizedAnswer = createDefaultPublicSynthesizedAnswer(
      query,
      cards,
      generatedAt,
    );
    const linesOfInquiry = createDefaultPublicLinesOfInquiry(
      query,
      cards,
      generatedAt,
    );

    const turn = createVoiceConversationTurn({
      id: "voice-turn:001",
      query,
      synthesizedAnswer,
      linesOfInquiry,
      rawTranscriptText: "How do computers extend thinking?",
      reviewedText: "How do computers extend thinking?",
      inputMode: "speech",
      createdAt: generatedAt,
    });

    expect(turn).toMatchObject({
      id: "voice-turn:001",
      queryId: "query:extended-thought-seed",
      lineId: "line-of-inquiry:query:extended-thought-seed:core_claim:v1",
      inputMode: "speech",
      rawTranscriptText: "How do computers extend thinking?",
      reviewedText: "How do computers extend thinking?",
      response: {
        synthesizedAnswerId:
          "synthesized-answer:query:extended-thought-seed:default:v1",
        nextQuestion:
          "What is the strongest source-backed claim about how people extend thought?",
      },
      membrane: {
        classification: "private",
        findings: [],
        quarantine: null,
      },
      persistence: {
        transcriptSourceTruth: false,
        modelReplySourceTruth: false,
      },
      createdAt: generatedAt,
    });
  });

  it("redacts secret-looking dictation before a voice turn can be persisted", () => {
    const generatedAt = "2026-05-29T21:22:00.000Z";
    const pastedToken = `sbp_${"e".repeat(40)}`;
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
    ];
    const synthesizedAnswer = createDefaultPublicSynthesizedAnswer(
      query,
      cards,
      generatedAt,
    );
    const linesOfInquiry = createDefaultPublicLinesOfInquiry(
      query,
      cards,
      generatedAt,
    );

    const turn = createVoiceConversationTurn({
      id: "voice-turn:secret",
      query,
      synthesizedAnswer,
      linesOfInquiry,
      rawTranscriptText: `Use ${pastedToken}`,
      reviewedText: `Use ${pastedToken}`,
      inputMode: "speech",
      createdAt: generatedAt,
    });

    expect(turn.rawTranscriptText).toBe("Use [REDACTED_SUPABASE_PAT]");
    expect(turn.reviewedText).toBe("Use [REDACTED_SUPABASE_PAT]");
    expect(turn.rawTranscriptText).not.toContain(pastedToken);
    expect(turn.reviewedText).not.toContain(pastedToken);
    expect(turn.membrane.classification).toBe("secret");
    expect(turn.membrane.findings).toHaveLength(2);
    expect(turn.membrane.quarantine).toMatchObject({
      sourcePath: "voice-turn:secret",
      errorCode: "secret_spill_redacted",
      recoverable: true,
    });
    expect(turn.membrane.quarantine?.message).toContain("Rotate the credential");
    expect(turn.membrane.quarantine?.message).not.toContain(pastedToken);
  });
});
