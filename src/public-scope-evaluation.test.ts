import publicDocumentFixture from "./fixtures/project-gutenberg-analytical-engine-public-document.json" with {
  type: "json",
};
import wikidataFixture from "./fixtures/wikidata-ada-lovelace-entity.json" with {
  type: "json",
};
import { describe, expect, it } from "vitest";

import {
  createImportScope,
  evaluatePublicScopeEvent,
  normalizePublicDocument,
  normalizeWikidataEntity,
  type PublicDocumentNormalizationInput,
  type WikidataEntityNormalizationInput,
} from "./index";

const adaScope = createImportScope({
  id: "scope:ada-lovelace-through-computing",
  membershipPolicy: {
    mode: "primary_required",
  },
  primaryEntity: {
    kind: "person",
    label: "Ada Lovelace",
    aliases: ["Augusta Ada Byron", "Ada King"],
    sourceIds: [
      {
        sourceFamily: "wikimedia",
        id: "Q7259",
        url: "https://www.wikidata.org/wiki/Q7259",
      },
    ],
  },
  focusEntity: {
    kind: "topic",
    label: "computing",
    aliases: ["Analytical Engine", "programming"],
    sourceIds: [],
  },
  sourceFamilies: ["wikimedia", "public_archive"],
  publicness: {
    access: "public_only",
    licenseIntent: "respect_source_license",
  },
  provenancePolicy: {
    sourceFamiliesCountAsIndependentEvidence: false,
  },
  createdAt: "2026-05-22T12:00:00.000Z",
});

const bootstrapScope = createImportScope({
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

describe("public scope event evaluation", () => {
  it("includes public source events that match the primary identity and focus identity", () => {
    const event = normalizePublicDocument(
      publicDocumentFixture as PublicDocumentNormalizationInput,
    );

    expect(evaluatePublicScopeEvent(adaScope, event)).toEqual({
      action: "include",
      reason: "primary_and_focus_match",
      confidence: 1,
      matchedTerms: ["Ada Lovelace", "Analytical Engine"],
    });
  });

  it("keeps primary identity matches in review when the focus identity is uncertain", () => {
    const event = normalizeWikidataEntity(
      wikidataFixture as WikidataEntityNormalizationInput,
    );

    expect(evaluatePublicScopeEvent(adaScope, event)).toEqual({
      action: "needs_review",
      reason: "primary_match_focus_uncertain",
      confidence: 0.65,
      matchedTerms: ["Ada Lovelace", "Augusta Ada Byron", "Q7259"],
    });
  });

  it("excludes public source events outside the primary identity", () => {
    const event = {
      ...normalizePublicDocument(
        publicDocumentFixture as PublicDocumentNormalizationInput,
      ),
      id: "public_archive:project_gutenberg:other",
      content: {
        kind: "text" as const,
        subject: "Unrelated public text",
        text: "A source record about steam engines and shipping.",
      },
      participants: [],
    };

    expect(evaluatePublicScopeEvent(adaScope, event)).toEqual({
      action: "exclude",
      reason: "primary_identity_missing",
      confidence: 0.9,
      matchedTerms: [],
    });
  });

  it("keeps focus identity matches in review when exploratory scope membership allows focus candidates", () => {
    const publicDocumentEvent = normalizePublicDocument(
      publicDocumentFixture as PublicDocumentNormalizationInput,
    );
    const event = {
      ...publicDocumentEvent,
      id: "wikimedia:wikipedia:623686",
      provenance: {
        ...publicDocumentEvent.provenance,
        sourceFamily: "wikimedia" as const,
      },
      content: {
        kind: "text" as const,
        subject: "Brain-computer interface",
        text: "Brain augmentation research includes brain-computer interfaces and neurotechnology.",
      },
      participants: [],
    };

    expect(evaluatePublicScopeEvent(bootstrapScope, event)).toEqual({
      action: "needs_review",
      reason: "focus_match_primary_uncertain",
      confidence: 0.65,
      matchedTerms: [
        "brain augmentation",
        "brain-computer interface",
        "neurotechnology",
      ],
    });
  });

  it("excludes disallowed source families before exploratory membership review", () => {
    const event = {
      ...normalizePublicDocument(
        publicDocumentFixture as PublicDocumentNormalizationInput,
      ),
      content: {
        kind: "text" as const,
        subject: "Neurotechnology",
        text: "Neurotechnology can support brain augmentation.",
      },
      participants: [],
    };

    expect(evaluatePublicScopeEvent(bootstrapScope, event)).toEqual({
      action: "exclude",
      reason: "source_family_not_allowed",
      confidence: 1,
      matchedTerms: ["brain augmentation", "neurotechnology"],
    });
  });
});
