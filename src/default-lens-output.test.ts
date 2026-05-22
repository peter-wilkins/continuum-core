import publicDocumentFixture from "./fixtures/project-gutenberg-analytical-engine-public-document.json" with {
  type: "json",
};
import wikidataFixture from "./fixtures/wikidata-ada-lovelace-entity.json" with {
  type: "json",
};
import { describe, expect, it } from "vitest";

import {
  createDefaultPublicLensOutputs,
  createImportScope,
  createPublicContinuumQuery,
  normalizePublicDocument,
  normalizeWikidataEntity,
  type PublicDocumentNormalizationInput,
  type WikidataEntityNormalizationInput,
} from "./index";

const adaScope = createImportScope({
  id: "scope:ada-lovelace-through-computing",
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

const adaQuery = createPublicContinuumQuery(adaScope, {
  id: "query:ada-lovelace-contribution",
  scopeId: "scope:ada-lovelace-through-computing",
  text: "What did Ada Lovelace contribute to early computing?",
  origin: "system_seed",
  createdAt: "2026-05-22T12:25:00.000Z",
});

describe("default public Lens output generation", () => {
  it("creates default public Lens outputs from scope query and canonical events", () => {
    const events = [
      normalizeWikidataEntity(wikidataFixture as WikidataEntityNormalizationInput),
      normalizePublicDocument(
        publicDocumentFixture as PublicDocumentNormalizationInput,
      ),
    ];

    const outputs = createDefaultPublicLensOutputs(
      adaScope,
      adaQuery,
      events,
      "2026-05-22T12:30:00.000Z",
    );

    expect(outputs.map((output) => output.lensId)).toEqual([
      "atlas",
      "loom",
      "beacon",
    ]);

    for (const output of outputs) {
      expect(output.scopeId).toBe(adaScope.id);
      expect(output.queryId).toBe(adaQuery.id);
      expect(output.generatedAt).toBe("2026-05-22T12:30:00.000Z");
      expect(output.sourceEventIds).toEqual([
        "wikidata:Q7259",
        "public_archive:project_gutenberg:75107",
      ]);
      expect(output.sections.flatMap((section) => section.eventIds)).toEqual(
        expect.arrayContaining(output.sourceEventIds),
      );
      expect(JSON.stringify(output)).not.toContain(
        "operations are distinguished from the objects",
      );
    }
  });
});
