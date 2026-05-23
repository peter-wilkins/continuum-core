import bootstrapScopeFixture from "./fixtures/import-scope-extended-thought-brain-augmentation.json" with {
  type: "json",
};
import { describe, expect, it } from "vitest";

import {
  createImportScope,
  createPublicContinuumQuery,
  importScopeTitle,
  type ImportScope,
} from "./index";

describe("bootstrap public Continuum scope", () => {
  it("defines a public import scope for extended thought through brain augmentation", () => {
    const scope = createImportScope(bootstrapScopeFixture as ImportScope);
    const query = createPublicContinuumQuery(scope, {
      id: "query:extended-thought-brain-augmentation-seed",
      scopeId: scope.id,
      text: "How have people tried to extend thought and augment the brain?",
      origin: "system_seed",
      createdAt: "2026-05-23T08:25:00.000Z",
    });

    expect(importScopeTitle(scope)).toBe(
      "extended thought through brain augmentation",
    );
    expect(scope.primaryEntity).toMatchObject({
      kind: "concept",
      label: "extended thought",
      aliases: expect.arrayContaining([
        "extended mind",
        "distributed cognition",
        "intelligence amplification",
      ]),
    });
    expect(scope.membershipPolicy).toEqual({
      mode: "primary_or_focus_review",
    });
    expect(scope.focusEntity).toMatchObject({
      kind: "concept",
      label: "brain augmentation",
      aliases: expect.arrayContaining([
        "brain-computer interface",
        "cognitive augmentation",
        "augmented cognition",
      ]),
    });
    expect(scope.sourceFamilies).toEqual([
      "wikimedia",
      "public_archive",
      "scholarly_metadata",
    ]);
    expect(query.text).toContain("extend thought");
  });
});
