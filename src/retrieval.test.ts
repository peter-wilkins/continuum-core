import { describe, expect, it } from "vitest";

import {
  type ImportedEntry,
  retrieveContinuationCandidates,
} from "./index";

function importedEntry(input: {
  id: string;
  canonicalEventId: string;
  occurredAt: string;
  subject: string | null;
  text: string;
}): ImportedEntry {
  return {
    id: input.id,
    canonicalEventId: input.canonicalEventId,
    source: {
      platform: "markdown",
      key: input.canonicalEventId,
      fingerprint: input.canonicalEventId,
      externalConversationId: input.canonicalEventId,
      externalMessageId: input.canonicalEventId,
      artifactId: input.canonicalEventId,
      externalParentId: null,
      canonicalParentEventId: null,
    },
    provenance: {
      sourceFamily: "local_documents",
      sourceName: "markdown",
      upstreamSources: [],
      derivedFrom: [],
      retrievedAt: "unknown",
      license: null,
    },
    captureContext: {
      capturedAt: input.occurredAt,
      contextClues: [],
    },
    time: {
      occurredAt: input.occurredAt,
      occurredAtConfidence: "exact",
    },
    actor: {
      role: "user",
    },
    participants: [],
    content: {
      kind: "text",
      subject: input.subject,
      text: input.text,
    },
  };
}

describe("Continuity Retrieval", () => {
  it("returns ranked Continuation Candidates for a Resume Request", () => {
    const candidates = retrieveContinuationCandidates({
      resumeRequest: {
        text: "resume membranes",
        requestedAt: "2026-05-21T12:00:00.000Z",
      },
      entries: [
        importedEntry({
          id: "entry:membranes-1",
          canonicalEventId: "markdown:membranes-1",
          occurredAt: "2026-05-21T10:00:00.000Z",
          subject: "Membranes",
          text: "Membranes filter data before it leaves the private core.",
        }),
        importedEntry({
          id: "entry:membranes-2",
          canonicalEventId: "markdown:membranes-2",
          occurredAt: "2026-05-20T10:00:00.000Z",
          subject: "Membranes",
          text: "GDPR erasure and disclosure membranes need a safety layer.",
        }),
        importedEntry({
          id: "entry:boiler-1",
          canonicalEventId: "markdown:boiler-1",
          occurredAt: "2026-05-21T11:00:00.000Z",
          subject: "Boiler quote",
          text: "Ask Bob whether the boiler is combi or system.",
        }),
      ],
    });

    expect(candidates).toHaveLength(2);
    expect(candidates[0]).toMatchObject({
      title: "Membranes",
      supportingEntryIds: ["entry:membranes-1", "entry:membranes-2"],
      rankingSignals: [
        {
          kind: "text_overlap",
          weight: 0.5,
        },
        {
          kind: "recency",
          weight: 0.2,
        },
        {
          kind: "recurrence",
          weight: 0.2,
        },
        {
          kind: "explicit_resume_cue",
          value: 1,
          weight: 0.1,
        },
      ],
    });
    expect(candidates[0]?.confidence).toBeGreaterThan(candidates[1]?.confidence ?? 1);
    expect(candidates[0]?.confidence).toBeGreaterThanOrEqual(0);
    expect(candidates[0]?.confidence).toBeLessThanOrEqual(1);
  });

  it("explains why Entries support a Continuation Candidate", () => {
    const candidates = retrieveContinuationCandidates({
      resumeRequest: {
        text: "resume membranes",
        requestedAt: "2026-05-21T12:00:00.000Z",
      },
      entries: [
        importedEntry({
          id: "entry:membranes-1",
          canonicalEventId: "markdown:membranes-1",
          occurredAt: "2026-05-21T10:00:00.000Z",
          subject: "Membranes",
          text: "Membranes filter data before it leaves the private core.",
        }),
      ],
    });

    expect(candidates[0]).toMatchObject({
      supportingEntries: [
        {
          entryId: "entry:membranes-1",
          linkReasons: [
            {
              rankingSignalKind: "text_overlap",
              text: "Matched request terms: membranes",
            },
            {
              rankingSignalKind: "recency",
              text: "Entry occurred at 2026-05-21T10:00:00.000Z",
            },
            {
              rankingSignalKind: "explicit_resume_cue",
              text: "Resume Request starts with an explicit retrieval cue.",
            },
          ],
        },
      ],
      signalEvidenceTrail: [
        {
          rankingSignalKind: "text_overlap",
          reason: "Candidate has request terms in supporting Entries.",
        },
        {
          rankingSignalKind: "recency",
          reason: "Candidate uses the most recent supporting Entry.",
        },
        {
          rankingSignalKind: "recurrence",
          reason: "Candidate has 1 supporting Entries.",
        },
        {
          rankingSignalKind: "explicit_resume_cue",
          reason: "Resume Request contains an explicit retrieval cue.",
        },
      ],
    });
  });
});
