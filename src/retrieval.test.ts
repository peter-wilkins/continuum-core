import { describe, expect, it } from "vitest";

import {
  createAmbiguousResumeSurface,
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

  it("returns top Continuation Candidate with alternates when Candidate Spread is narrow", () => {
    const surface = createAmbiguousResumeSurface({
      resumeRequest: {
        text: "resume membranes",
        requestedAt: "2026-05-21T12:00:00.000Z",
      },
      narrowSpreadThreshold: 0.1,
      entries: [
        importedEntry({
          id: "entry:privacy-1",
          canonicalEventId: "markdown:privacy-1",
          occurredAt: "2026-05-21T10:00:00.000Z",
          subject: "Privacy membranes",
          text: "Membranes filter data before it leaves the private core.",
        }),
        importedEntry({
          id: "entry:gdpr-1",
          canonicalEventId: "markdown:gdpr-1",
          occurredAt: "2026-05-21T10:00:00.000Z",
          subject: "GDPR membranes",
          text: "Membranes and erasure need a safety layer.",
        }),
        importedEntry({
          id: "entry:boiler-1",
          canonicalEventId: "markdown:boiler-1",
          occurredAt: "2026-05-01T10:00:00.000Z",
          subject: "Boiler quote",
          text: "Ask Bob whether the boiler is combi or system.",
        }),
      ],
    });

    expect(surface).toMatchObject({
      kind: "ambiguous_resume",
      isAmbiguous: true,
      topCandidate: {
        title: "GDPR membranes",
      },
      alternateCandidates: [
        {
          title: "Privacy membranes",
        },
        {
          title: "Boiler quote",
        },
      ],
      candidates: [
        {
          title: "GDPR membranes",
        },
        {
          title: "Privacy membranes",
        },
        {
          title: "Boiler quote",
        },
      ],
    });
    expect(surface.candidateSpread).not.toBeNull();
    expect(surface.candidateSpread ?? 1).toBeLessThanOrEqual(0.1);
  });

  it("marks clear winner retrieval as unambiguous", () => {
    const surface = createAmbiguousResumeSurface({
      resumeRequest: {
        text: "resume membranes",
        requestedAt: "2026-05-21T12:00:00.000Z",
      },
      narrowSpreadThreshold: 0.05,
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
          occurredAt: "2026-05-21T11:00:00.000Z",
          subject: "Membranes",
          text: "Disclosure membranes and erasure need a safety layer.",
        }),
        importedEntry({
          id: "entry:boiler-1",
          canonicalEventId: "markdown:boiler-1",
          occurredAt: "2026-05-01T10:00:00.000Z",
          subject: "Boiler quote",
          text: "Ask Bob whether the boiler is combi or system.",
        }),
      ],
    });

    expect(surface.topCandidate?.title).toBe("Membranes");
    expect(surface.alternateCandidates.map((candidate) => candidate.title)).toEqual([
      "Boiler quote",
    ]);
    expect(surface.isAmbiguous).toBe(false);
  });
});
