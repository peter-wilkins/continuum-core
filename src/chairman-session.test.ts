import { describe, expect, it } from "vitest";

import {
  rebuildChairmanSession,
  type ChairmanEvent,
} from "./index";

describe("Chairman Session", () => {
  it("rebuilds a Chairman Session agenda from append-only events", () => {
    const events: ChairmanEvent[] = [
      {
        id: "chairman-event:001",
        kind: "session_started",
        sessionId: "chairman-session:mvp-grill",
        occurredAt: "2026-05-22T20:10:00.000Z",
        sourceEventIds: ["source-event:conversation-001"],
        rootLine: {
          id: "line:root",
          title: "Define the MVP path",
          question: "What needs to be true before the MVP can go live?",
          desiredOutcome: "A buildable issue sequence",
          sourceEventIds: ["source-event:conversation-001"],
        },
      },
      {
        id: "chairman-event:002",
        kind: "line_added",
        sessionId: "chairman-session:mvp-grill",
        occurredAt: "2026-05-22T20:12:00.000Z",
        sourceEventIds: ["source-event:conversation-002"],
        line: {
          id: "line:feedback",
          parentLineId: "line:root",
          title: "Feedback path",
          question: "How should early users give useful feedback?",
          desiredOutcome: "A low-friction feedback loop",
          sourceEventIds: ["source-event:conversation-002"],
        },
      },
      {
        id: "chairman-event:003",
        kind: "decision_recorded",
        sessionId: "chairman-session:mvp-grill",
        occurredAt: "2026-05-22T20:14:00.000Z",
        sourceEventIds: ["source-event:conversation-003"],
        decision: {
          id: "decision:001",
          lineId: "line:feedback",
          kind: "agreement",
          summary: "Use thumbs-up Lens feedback for the public MVP.",
          sourceEventIds: ["source-event:conversation-003"],
          decidedAt: "2026-05-22T20:14:00.000Z",
        },
      },
      {
        id: "chairman-event:004",
        kind: "line_status_changed",
        sessionId: "chairman-session:mvp-grill",
        occurredAt: "2026-05-22T20:15:00.000Z",
        sourceEventIds: ["source-event:conversation-004"],
        lineId: "line:feedback",
        lifecycleStatus: "resolved",
      },
    ];

    const session = rebuildChairmanSession(events);

    expect(session).toMatchObject({
      id: "chairman-session:mvp-grill",
      title: "Define the MVP path",
      rootLineId: "line:root",
      activeLineId: "line:root",
      parkedLineIds: [],
      lines: [
        {
          id: "line:root",
          title: "Define the MVP path",
          question: "What needs to be true before the MVP can go live?",
          desiredOutcome: "A buildable issue sequence",
          outcomeStatus: "unknown",
          lifecycleStatus: "active",
          parentLineId: null,
          sourceEventIds: ["source-event:conversation-001"],
          decisions: [],
        },
        {
          id: "line:feedback",
          title: "Feedback path",
          question: "How should early users give useful feedback?",
          desiredOutcome: "A low-friction feedback loop",
          outcomeStatus: "unknown",
          lifecycleStatus: "resolved",
          parentLineId: "line:root",
          sourceEventIds: ["source-event:conversation-002"],
          decisions: [
            {
              id: "decision:001",
              kind: "agreement",
              summary: "Use thumbs-up Lens feedback for the public MVP.",
            },
          ],
        },
      ],
    });
    expect(session.decisions.map((decision) => decision.id)).toEqual([
      "decision:001",
    ]);
  });

  it("rejects a resolved Chairman line without a decision", () => {
    expect(() =>
      rebuildChairmanSession([
        {
          id: "chairman-event:001",
          kind: "session_started",
          sessionId: "chairman-session:bad",
          occurredAt: "2026-05-22T20:10:00.000Z",
          sourceEventIds: ["source-event:conversation-001"],
          rootLine: {
            id: "line:root",
            title: "Define the MVP path",
            question: "What needs to be true before the MVP can go live?",
            desiredOutcome: "A buildable issue sequence",
            sourceEventIds: ["source-event:conversation-001"],
          },
        },
        {
          id: "chairman-event:002",
          kind: "line_status_changed",
          sessionId: "chairman-session:bad",
          occurredAt: "2026-05-22T20:12:00.000Z",
          sourceEventIds: ["source-event:conversation-002"],
          lineId: "line:root",
          lifecycleStatus: "resolved",
        },
      ]),
    ).toThrow("Resolved or abandoned Chairman Lines require at least one Decision.");
  });

  it("rebuilds Chairman Line outcome status from append-only events", () => {
    const session = rebuildChairmanSession([
      {
        id: "chairman-event:001",
        kind: "session_started",
        sessionId: "chairman-session:outcome",
        occurredAt: "2026-05-22T20:10:00.000Z",
        sourceEventIds: ["source-event:conversation-001"],
        rootLine: {
          id: "line:root",
          title: "Define the MVP path",
          question: "What needs to be true before the MVP can go live?",
          desiredOutcome: "A buildable issue sequence",
          sourceEventIds: ["source-event:conversation-001"],
        },
      },
      {
        id: "chairman-event:002",
        kind: "line_outcome_changed",
        sessionId: "chairman-session:outcome",
        occurredAt: "2026-05-22T20:12:00.000Z",
        sourceEventIds: ["source-event:conversation-002"],
        lineId: "line:root",
        desiredOutcome: "A deployable public demo",
        outcomeStatus: "defined",
      },
    ]);

    expect(session.lines[0]).toMatchObject({
      id: "line:root",
      desiredOutcome: "A deployable public demo",
      outcomeStatus: "defined",
    });
  });
});
