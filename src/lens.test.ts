import { describe, expect, it } from "vitest";

import {
  createLensOutput,
  defaultPublicLensDefinitions,
  type LensOutput,
} from "./index";

describe("Lens projections", () => {
  it("defines MVP Lens definitions with user and technical blurbs", () => {
    expect(defaultPublicLensDefinitions.map((lens) => lens.name)).toEqual([
      "Atlas",
      "Loom",
      "Beacon",
    ]);

    for (const lens of defaultPublicLensDefinitions) {
      expect(lens.id).toMatch(/^[a-z]+$/);
      expect(lens.version).toMatch(/^[0-9]+\.[0-9]+\.[0-9]+$/);
      expect(lens.userBlurb.length).toBeGreaterThan(0);
      expect(lens.technicalBlurb.length).toBeGreaterThan(0);
    }
  });

  it("stores a Lens output as ordered canonical event ids without copied event payloads", () => {
    const output = createLensOutput({
      id: "lens-output:ada-computing:atlas:v1",
      scopeId: "scope:ada-lovelace-through-computing",
      queryId: "query:ada-lovelace-contribution",
      lensId: "atlas",
      lensVersion: "1.0.0",
      generatedAt: "2026-05-22T12:10:00.000Z",
      sourceEventIds: [
        "wikidata:Q7259",
        "public_archive:project_gutenberg:75107",
      ],
      sections: [
        {
          id: "section:identity",
          title: "Identity",
          eventIds: ["wikidata:Q7259"],
        },
        {
          id: "section:source-text",
          title: "Source Text",
          eventIds: ["public_archive:project_gutenberg:75107"],
        },
      ],
      generation: {
        strategy: "deterministic_fixture",
        model: null,
        parameters: [
          {
            key: "ordering",
            value: "identity_then_text",
          },
        ],
      },
    });

    expect(output).toEqual<LensOutput>({
      id: "lens-output:ada-computing:atlas:v1",
      scopeId: "scope:ada-lovelace-through-computing",
      queryId: "query:ada-lovelace-contribution",
      lensId: "atlas",
      lensVersion: "1.0.0",
      generatedAt: "2026-05-22T12:10:00.000Z",
      sourceEventIds: [
        "wikidata:Q7259",
        "public_archive:project_gutenberg:75107",
      ],
      sections: [
        {
          id: "section:identity",
          title: "Identity",
          eventIds: ["wikidata:Q7259"],
        },
        {
          id: "section:source-text",
          title: "Source Text",
          eventIds: ["public_archive:project_gutenberg:75107"],
        },
      ],
      generation: {
        strategy: "deterministic_fixture",
        model: null,
        parameters: [
          {
            key: "ordering",
            value: "identity_then_text",
          },
        ],
      },
    });
  });

  it("rejects Lens outputs that reference events outside the source set", () => {
    expect(() =>
      createLensOutput({
        id: "lens-output:bad",
        scopeId: "scope:ada-lovelace-through-computing",
        queryId: "query:ada-lovelace-contribution",
        lensId: "atlas",
        lensVersion: "1.0.0",
        generatedAt: "2026-05-22T12:10:00.000Z",
        sourceEventIds: ["wikidata:Q7259"],
        sections: [
          {
            id: "section:bad",
            title: "Bad",
            eventIds: ["public_archive:project_gutenberg:75107"],
          },
        ],
        generation: {
          strategy: "deterministic_fixture",
          model: null,
          parameters: [],
        },
      }),
    ).toThrow("LensOutput section eventIds must come from sourceEventIds.");
  });
});
