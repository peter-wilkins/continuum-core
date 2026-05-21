import { describe, expect, it } from "vitest";

import { postponedSourceCatalogue, sourceCatalogue } from "./source-catalogue";

describe("source catalogue", () => {
  it("ranks ten active import sources without putting ChatGPT in the active path", () => {
    expect(sourceCatalogue).toHaveLength(10);
    expect(sourceCatalogue.map((entry) => entry.rank)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
    expect(sourceCatalogue.map((entry) => entry.id)).not.toContain("chatgpt-export");
    expect(postponedSourceCatalogue[0]?.id).toBe("chatgpt-export");
  });

  it("identifies evidence and the next event target for every active source", () => {
    for (const entry of sourceCatalogue) {
      expect(entry.officialDocs.length).toBeGreaterThan(0);
      expect(entry.nextEventTarget.length).toBeGreaterThan(0);
    }
  });

  it("represents Wikimedia as a source family instead of one schema", () => {
    const wikimedia = sourceCatalogue.find(
      (entry) => entry.id === "wikimedia-family",
    );

    expect(wikimedia?.name).toContain("Wikimedia");
    expect(wikimedia?.nextEventTarget).toBe("MediaWiki page revision");
  });
});
