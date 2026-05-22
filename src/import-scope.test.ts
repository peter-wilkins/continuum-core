import { describe, expect, it } from "vitest";

import {
  createImportScope,
  importScopeTitle,
  type ImportScope,
} from "./index";

describe("public import scopes", () => {
  it("defines an identity-first public import scope for Ada Lovelace about computing", () => {
    const scope = createImportScope({
      id: "scope:ada-lovelace-through-computing",
      primaryEntity: {
        kind: "person",
        label: "Ada Lovelace",
        aliases: ["Augusta Ada King", "Countess of Lovelace"],
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
        aliases: ["computation", "computer science"],
        sourceIds: [
          {
            sourceFamily: "wikimedia",
            id: "Q179310",
            url: "https://www.wikidata.org/wiki/Q179310",
          },
        ],
      },
      sourceFamilies: ["wikimedia"],
      publicness: {
        access: "public_only",
        licenseIntent: "respect_source_license",
      },
      provenancePolicy: {
        sourceFamiliesCountAsIndependentEvidence: false,
      },
      createdAt: "2026-05-22T12:00:00.000Z",
    });

    expect(scope).toEqual<ImportScope>({
      id: "scope:ada-lovelace-through-computing",
      primaryEntity: {
        kind: "person",
        label: "Ada Lovelace",
        aliases: ["Augusta Ada King", "Countess of Lovelace"],
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
        aliases: ["computation", "computer science"],
        sourceIds: [
          {
            sourceFamily: "wikimedia",
            id: "Q179310",
            url: "https://www.wikidata.org/wiki/Q179310",
          },
        ],
      },
      sourceFamilies: ["wikimedia"],
      publicness: {
        access: "public_only",
        licenseIntent: "respect_source_license",
      },
      provenancePolicy: {
        sourceFamiliesCountAsIndependentEvidence: false,
      },
      createdAt: "2026-05-22T12:00:00.000Z",
    });
    expect(importScopeTitle(scope)).toBe("Ada Lovelace through computing");
    expect(JSON.parse(JSON.stringify(scope))).toEqual(scope);
  });

  it("rejects broad public import scopes without an allowed source family", () => {
    expect(() =>
      createImportScope({
        id: "scope:ada-lovelace",
        primaryEntity: {
          kind: "person",
          label: "Ada Lovelace",
          aliases: [],
          sourceIds: [],
        },
        focusEntity: null,
        sourceFamilies: [],
        publicness: {
          access: "public_only",
          licenseIntent: "respect_source_license",
        },
        provenancePolicy: {
          sourceFamiliesCountAsIndependentEvidence: false,
        },
        createdAt: "2026-05-22T12:00:00.000Z",
      }),
    ).toThrow("ImportScope sourceFamilies must contain at least one source family.");
  });
});
