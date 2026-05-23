import { describe, expect, it } from "vitest";

import {
  createImportScope,
  createPublicContinuumQuery,
  type ImportScope,
  type PublicContinuumQuery,
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

describe("public Continuum query", () => {
  it("defines the initial public query for Ada Lovelace through computing", () => {
    const query = createPublicContinuumQuery(adaScope, {
      id: "query:ada-lovelace-contribution",
      scopeId: "scope:ada-lovelace-through-computing",
      text: "What did Ada Lovelace contribute to early computing?",
      origin: "system_seed",
      createdAt: "2026-05-22T12:25:00.000Z",
    });

    expect(query).toEqual<PublicContinuumQuery>({
      id: "query:ada-lovelace-contribution",
      scopeId: "scope:ada-lovelace-through-computing",
      text: "What did Ada Lovelace contribute to early computing?",
      origin: "system_seed",
      createdAt: "2026-05-22T12:25:00.000Z",
    });
  });

  it("rejects public queries attached to the wrong scope", () => {
    expect(() =>
      createPublicContinuumQuery(
        adaScope,
        {
          id: "query:wrong-scope",
          scopeId: "scope:another",
          text: "What did Ada Lovelace contribute to early computing?",
          origin: "system_seed",
          createdAt: "2026-05-22T12:25:00.000Z",
        } satisfies PublicContinuumQuery,
      ),
    ).toThrow("PublicContinuumQuery scopeId must match the ImportScope id.");
  });

  it("rejects blank public queries", () => {
    expect(() =>
      createPublicContinuumQuery(
        adaScope,
        {
          id: "query:blank",
          scopeId: adaScope.id,
          text: "",
          origin: "system_seed",
          createdAt: "2026-05-22T12:25:00.000Z",
        } satisfies PublicContinuumQuery,
      ),
    ).toThrow("PublicContinuumQuery text must not be blank.");
  });
});
