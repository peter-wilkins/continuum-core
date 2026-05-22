import { describe, expect, it } from "vitest";

import {
  createCuratorFeedbackSignal,
  recordCuratorFeedbackSignal,
  summarizeCuratorFeedbackSignals,
  type CuratorFeedbackSignal,
} from "./index";

describe("Curator feedback", () => {
  it("records a Curator feedback signal for a memory candidate", () => {
    const existingSignals: CuratorFeedbackSignal[] = [];
    const signal = createCuratorFeedbackSignal({
      id: "curator-feedback:001",
      userId: "user:peter",
      target: {
        kind: "imported_entry",
        importedEntryId: "entry:github_issue:octocat/Hello-World#9578",
        canonicalEventId: "github_issue:octocat/Hello-World#9578",
      },
      action: "keep",
      confidence: 0.8,
      surface: "idle_review",
      rationale: null,
      recordedAt: "2026-05-22T20:00:00.000Z",
    });

    const recordedSignals = recordCuratorFeedbackSignal({
      existingSignals,
      signal,
    });

    expect(existingSignals).toEqual([]);
    expect(recordedSignals).toEqual([signal]);
  });

  it("summarizes Curator feedback without treating one signal as unquestionable truth", () => {
    const target = {
      kind: "live_captured_thought" as const,
      thoughtId: "thought:morning-note",
      sourceEventIds: ["source-log:raw-transcript-001"],
    };
    const signal = createCuratorFeedbackSignal({
      id: "curator-feedback:002",
      userId: "user:peter",
      target,
      action: "important",
      confidence: 1,
      surface: "compass_review",
      rationale: "Useful enough to keep visible.",
      recordedAt: "2026-05-22T20:01:00.000Z",
    });

    const summary = summarizeCuratorFeedbackSignals({
      target,
      signals: [signal],
    });

    expect(summary).toMatchObject({
      target,
      signalCount: 1,
      actionCounts: {
        important: 1,
        keep: 0,
        not_useful: 0,
        me: 0,
        not_me: 0,
        passing_thought: 0,
        private: 0,
        shareable: 0,
      },
      memoryDecision: {
        action: "include",
        reasons: ["positive_curator_feedback"],
      },
    });
    expect(summary.memoryDecision.confidence).toBeLessThan(1);
  });

  it("rejects Curator feedback with a blank live thought id", () => {
    expect(() =>
      createCuratorFeedbackSignal({
        id: "curator-feedback:bad",
        userId: "user:peter",
        target: {
          kind: "live_captured_thought",
          thoughtId: "",
          sourceEventIds: [],
        },
        action: "keep",
        confidence: 1,
        surface: "capture_review",
        rationale: null,
        recordedAt: "2026-05-22T20:02:00.000Z",
      }),
    ).toThrow("CuratorFeedback target.thoughtId must not be blank.");
  });
});
