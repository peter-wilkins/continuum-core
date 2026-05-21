import { describe, expect, it } from "vitest";

import {
  compareRankingProfiles,
  createAmbiguousResumeSurface,
  debugRankingProfiles,
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
      rankingProfile: debugRankingProfiles.balanced,
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
      rankingProfile: debugRankingProfiles.balanced,
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
      rankingProfile: debugRankingProfiles.balanced,
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
      rankingProfile: debugRankingProfiles.balanced,
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

  it("compares Continuation Candidate rankings across Ranking Profiles", () => {
    const entries = [
      importedEntry({
        id: "entry:membranes-1",
        canonicalEventId: "markdown:membranes-1",
        occurredAt: "2026-03-21T12:00:00.000Z",
        subject: "Membranes",
        text: "Membranes filter data before it leaves the private core.",
      }),
      importedEntry({
        id: "entry:membranes-2",
        canonicalEventId: "markdown:membranes-2",
        occurredAt: "2026-03-20T12:00:00.000Z",
        subject: "Membranes",
        text: "Disclosure membranes and erasure need a safety layer.",
      }),
      importedEntry({
        id: "entry:boiler-1",
        canonicalEventId: "markdown:boiler-1",
        occurredAt: "2026-05-21T11:30:00.000Z",
        subject: "Boiler quote",
        text: "Ask Bob whether the boiler is combi or system.",
      }),
    ];

    const comparison = compareRankingProfiles({
      resumeRequest: {
        text: "resume membranes",
        requestedAt: "2026-05-21T12:00:00.000Z",
      },
      entries,
      rankingProfiles: [
        debugRankingProfiles.balanced,
        debugRankingProfiles.recency_heavy,
      ],
    });

    expect(comparison.profileResults).toHaveLength(2);
    expect(comparison.profileResults[0]?.profile).toMatchObject({
      name: "balanced",
      debugOnly: true,
      weights: {
        text_overlap: 0.5,
        recency: 0.2,
        recurrence: 0.2,
        explicit_resume_cue: 0.1,
      },
    });
    expect(comparison.profileResults[0]?.candidates[0]).toMatchObject({
      title: "Membranes",
    });
    expect(comparison.profileResults[1]?.profile).toMatchObject({
      name: "recency_heavy",
      debugOnly: true,
      weights: {
        text_overlap: 0.2,
        recency: 0.65,
        recurrence: 0.1,
        explicit_resume_cue: 0.05,
      },
    });
    expect(comparison.profileResults[1]?.candidates[0]).toMatchObject({
      title: "Boiler quote",
    });
  });
});
