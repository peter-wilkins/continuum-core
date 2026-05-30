import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  postponedSourceCatalogue,
  renderSourceCatalogueMarkdownTable,
  sourceCatalogue,
} from "./source-catalogue";

describe("source catalogue", () => {
  it("ranks active import sources without putting ChatGPT in the active path", () => {
    expect(sourceCatalogue).toHaveLength(17);
    expect(sourceCatalogue.map((entry) => entry.rank)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
    ]);
    expect(sourceCatalogue.map((entry) => entry.id)).not.toContain("chatgpt-export");
    expect(postponedSourceCatalogue[0]?.id).toBe("chatgpt-export");
  });

  it("identifies evidence and the next event target for every active source", () => {
    for (const entry of sourceCatalogue) {
      expect(entry.officialDocs.length).toBeGreaterThan(0);
      expect(entry.nextEventTarget.length).toBeGreaterThan(0);
      expect(entry.provenance.sourceFamily.length).toBeGreaterThan(0);
      expect(entry.provenance.sourceName.length).toBeGreaterThan(0);
      expect(entry.provenance.overlapWarning.length).toBeGreaterThan(0);
    }
  });

  it("represents Wikimedia as a source family instead of one schema", () => {
    const wikimedia = sourceCatalogue.find(
      (entry) => entry.id === "wikimedia-family",
    );

    expect(wikimedia?.name).toContain("Wikimedia");
    expect(wikimedia?.nextEventTarget).toBe("Wikidata entity snapshot");
    expect(wikimedia?.provenance.sourceFamily).toBe("wikimedia");
    expect(wikimedia?.provenance.upstreamSources).toContain("wikimedia");
  });

  it("splits Google Takeout into concrete source families", () => {
    expect(sourceCatalogue.map((entry) => entry.id)).toEqual(
      expect.arrayContaining([
        "google-chrome-history",
        "google-chrome-bookmarks",
        "google-chrome-reading-list",
        "google-my-activity",
        "youtube-history",
        "google-contacts",
        "google-maps-location-activity",
      ]),
    );
  });

  it("keeps the Markdown source catalogue table generated from the typed catalogue", () => {
    const docs = readFileSync(
      fileURLToPath(new URL("../docs/source-catalogue.md", import.meta.url)),
      "utf8",
    );

    expect(docs).toContain(renderSourceCatalogueMarkdownTable());
  });
});
