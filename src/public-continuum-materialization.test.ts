import { describe, expect, it } from "vitest";

import {
  createImportScope,
  createPublicContinuumMaterialization,
  createPublicContinuumQuery,
  type ImportScope,
  type PublicDocumentNormalizationInput,
} from "./index";

const scope = createImportScope({
  id: "scope:extended-thought-brain-augmentation",
  membershipPolicy: {
    mode: "primary_or_focus_review",
  },
  primaryEntity: {
    kind: "concept",
    label: "extended thought",
    aliases: ["extended mind", "distributed cognition"],
    sourceIds: [],
  },
  focusEntity: {
    kind: "concept",
    label: "brain augmentation",
    aliases: ["brain-computer interface", "neurotechnology"],
    sourceIds: [],
  },
  sourceFamilies: ["wikimedia"],
  publicness: {
    access: "public_only",
    licenseIntent: "respect_source_license",
  },
  provenancePolicy: {
    sourceFamiliesCountAsIndependentEvidence: false,
  },
  createdAt: "2026-05-23T08:20:00.000Z",
});

const query = createPublicContinuumQuery(scope, {
  id: "query:extended-thought-brain-augmentation-seed",
  scopeId: scope.id,
  text: "How have people tried to extend thought and augment the brain?",
  origin: "system_seed",
  createdAt: "2026-05-23T08:25:00.000Z",
});

describe("public Continuum materialization", () => {
  it("materializes public documents into active Thought Cards and review candidates", () => {
    const materialization = createPublicContinuumMaterialization({
      scope,
      query,
      documents: [
        publicDocument({
          title: "Augmented cognition",
          sourceId: "7113944",
          revision: "1324006330",
          text: [
            "Augmented cognition uses systems to support extended thought and intelligence amplification.",
            "Brain augmentation tools can change human-computer interaction.",
          ].join("\n\n"),
        }),
        publicDocument({
          title: "Brain-computer interface",
          sourceId: "623686",
          revision: "1354854338",
          text: "Brain-computer interfaces and neurotechnology connect brain signals to devices.",
        }),
      ],
      generatedAt: "2026-05-23T09:35:00.000Z",
    });

    expect(materialization.events.map((event) => event.id)).toEqual([
      "wikimedia:wikipedia:7113944",
      "wikimedia:wikipedia:623686",
    ]);
    expect(materialization.activeEventIds).toEqual([
      "wikimedia:wikipedia:7113944",
    ]);
    expect(materialization.reviewEventIds).toEqual([
      "wikimedia:wikipedia:623686",
    ]);
    expect(materialization.excludedEventIds).toEqual([]);
    expect(materialization.decisions).toMatchObject([
      {
        eventId: "wikimedia:wikipedia:7113944",
        decision: {
          action: "include",
          reason: "primary_and_focus_match",
        },
      },
      {
        eventId: "wikimedia:wikipedia:623686",
        decision: {
          action: "needs_review",
          reason: "focus_match_primary_uncertain",
        },
      },
    ]);
    expect(materialization.sourceParagraphs).toHaveLength(2);
    expect(
      materialization.sourceParagraphs.map(
        (paragraph) => paragraph.canonicalEventId,
      ),
    ).toEqual([
      "wikimedia:wikipedia:7113944",
      "wikimedia:wikipedia:7113944",
    ]);
    expect(materialization.lensOutputs.map((output) => output.lensId)).toEqual([
      "atlas",
      "loom",
      "beacon",
    ]);
    expect(materialization.thoughtCards).toHaveLength(6);
    expect(
      new Set(materialization.thoughtCards.map((card) => card.lensOutputId)),
    ).toEqual(
      new Set(materialization.lensOutputs.map((output) => output.id)),
    );
    expect(materialization.synthesizedAnswer).toMatchObject({
      id: "synthesized-answer:query:extended-thought-brain-augmentation-seed:default:v1",
      queryId: "query:extended-thought-brain-augmentation-seed",
      status: "answered",
      lensOutputIdsForCompare: materialization.lensOutputs.map(
        (output) => output.id,
      ),
      generation: {
        strategy: "default_source_support_summary",
        model: null,
      },
    });
    expect(materialization.synthesizedAnswer.sourceSupport).toHaveLength(2);
  });

  it("fails clearly when no public documents are active", () => {
    expect(() =>
      createPublicContinuumMaterialization({
        scope,
        query,
        documents: [
          publicDocument({
            title: "Brain-computer interface",
            sourceId: "623686",
            revision: "1354854338",
            text: "Brain-computer interfaces and neurotechnology connect brain signals to devices.",
          }),
        ],
        generatedAt: "2026-05-23T09:35:00.000Z",
      }),
    ).toThrow(
      "Public Continuum materialization requires at least one included event.",
    );
  });
});

function publicDocument(input: {
  title: string;
  sourceId: string;
  revision: string;
  text: string;
}): PublicDocumentNormalizationInput {
  return {
    source: {
      platform: "wikimedia",
      sourceFamily: "wikimedia",
      sourceName: "wikipedia",
      sourceId: input.sourceId,
      sourceUrl: `https://en.wikipedia.org/?curid=${input.sourceId}`,
      retrievedAt: "2026-05-23T08:19:37.680Z",
      license:
        "Wikipedia text is available under CC BY-SA 4.0; additional terms may apply.",
      upstreamSources: ["en.wikipedia.org"],
      derivedFrom: [`enwiki-revision:${input.revision}`],
    },
    document: {
      title: input.title,
      language: "en",
      publishedAt: "2026-05-18T16:27:14.000Z",
      publishedAtConfidence: "exact",
      creators: [
        {
          role: "author",
          name: "Wikipedia contributors",
        },
      ],
      subjectTags: [input.title],
      text: input.text,
    },
  };
}
