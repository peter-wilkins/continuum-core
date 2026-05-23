import { describe, expect, it } from "vitest";

import {
  findRedundantLensOutputs,
  type LensOutput,
} from "./index";

const atlasOutput: LensOutput = {
  id: "lens-output:bootstrap:atlas:1.0.0",
  scopeId: "scope:extended-thought-brain-augmentation",
  queryId: "query:bootstrap-extended-thought",
  lensId: "atlas",
  lensVersion: "1.0.0",
  generatedAt: "2026-05-23T08:30:00.000Z",
  sourceEventIds: ["wikimedia:Q1", "wikimedia:Q2", "public_archive:work:1"],
  sections: [
    {
      id: "atlas:source-trail",
      title: "Source Trail",
      eventIds: ["wikimedia:Q1", "wikimedia:Q2", "public_archive:work:1"],
    },
  ],
  generation: {
    strategy: "default_atlas",
    model: null,
    parameters: [],
  },
};

const loomSameDisplayOrder: LensOutput = {
  ...atlasOutput,
  id: "lens-output:bootstrap:loom:1.0.0",
  lensId: "loom",
  generation: {
    strategy: "default_loom",
    model: null,
    parameters: [],
  },
};

const beaconDifferentDisplayOrder: LensOutput = {
  ...atlasOutput,
  id: "lens-output:bootstrap:beacon:1.0.0",
  lensId: "beacon",
  sourceEventIds: ["public_archive:work:1", "wikimedia:Q2", "wikimedia:Q1"],
  sections: [
    {
      id: "beacon:strongest-signals",
      title: "Strongest Signals",
      eventIds: ["public_archive:work:1", "wikimedia:Q2", "wikimedia:Q1"],
    },
  ],
  generation: {
    strategy: "default_beacon",
    model: null,
    parameters: [],
  },
};

describe("Lens diversity", () => {
  it("flags redundant Lens outputs when they would show the same Thought Card order", () => {
    const report = findRedundantLensOutputs([
      atlasOutput,
      loomSameDisplayOrder,
      beaconDifferentDisplayOrder,
    ]);

    expect(report).toEqual({
      uniqueLensOutputIds: [
        "lens-output:bootstrap:atlas:1.0.0",
        "lens-output:bootstrap:beacon:1.0.0",
      ],
      redundantLensOutputIds: ["lens-output:bootstrap:loom:1.0.0"],
      findings: [
        {
          retainedLensOutputId: "lens-output:bootstrap:atlas:1.0.0",
          redundantLensOutputId: "lens-output:bootstrap:loom:1.0.0",
          reason: "same_source_event_order",
          confidence: 1,
        },
      ],
    });
  });
});
