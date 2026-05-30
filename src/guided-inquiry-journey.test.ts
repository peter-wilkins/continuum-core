import { describe, expect, it } from "vitest";

import {
  advanceGuidedInquiryJourney,
  extendedThoughtGuidedInquiryJourney,
} from "./index";

describe("Guided Inquiry Journey", () => {
  it("seeds extended thought with a small Socratic question path", () => {
    expect(extendedThoughtGuidedInquiryJourney).toMatchObject({
      id: "guided-inquiry:extended-thought:socratic-v0",
      title: "Extended thought",
      topic: "How tools extend human thought",
      steps: [
        {
          kind: "clarify",
          question: "When does a tool stop being separate from thought?",
        },
        { kind: "assumption" },
        { kind: "evidence" },
        { kind: "alternative" },
        { kind: "consequence" },
        { kind: "meta" },
      ],
    });
  });

  it("advances the extended thought journey with an agreement and next question", () => {
    const result = advanceGuidedInquiryJourney({
      journey: extendedThoughtGuidedInquiryJourney,
      currentStepId: "guided-inquiry-step:extended-thought:clarify",
      userAnswer: "  when I trust it without thinking about the interface  ",
    });

    expect(result).toMatchObject({
      journeyId: "guided-inquiry:extended-thought:socratic-v0",
      answeredStepId: "guided-inquiry-step:extended-thought:clarify",
      agreement:
        "You are drawing the boundary around: when I trust it without thinking about the interface",
      nextStep: {
        id: "guided-inquiry-step:extended-thought:assumption",
        question: "What are you assuming a mind can do on its own?",
      },
      progress: 0.25,
      progressLabel: "Next question ready",
    });
  });

  it("rejects an answer for an unknown journey step", () => {
    expect(() =>
      advanceGuidedInquiryJourney({
        journey: extendedThoughtGuidedInquiryJourney,
        currentStepId: "guided-inquiry-step:missing",
        userAnswer: "I have an answer.",
      }),
    ).toThrow("Guided Inquiry step was not found in this journey.");
  });
});
