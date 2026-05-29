import bootstrapScopeFixture from "./fixtures/import-scope-extended-thought-brain-augmentation.json" with {
  type: "json",
};
import { describe, expect, it } from "vitest";

import {
  createDefaultPublicLensOutputs,
  createImportScope,
  createPublicContinuumQuery,
  findRedundantLensOutputs,
  type CanonicalEvent,
  type ImportScope,
} from "./index";

const bootstrapScope = createImportScope(bootstrapScopeFixture as ImportScope);
const bootstrapQuery = createPublicContinuumQuery(bootstrapScope, {
  id: "query:extended-thought-brain-augmentation-seed",
  scopeId: bootstrapScope.id,
  text: "How have people tried to extend thought and augment the brain?",
  origin: "system_seed",
  createdAt: "2026-05-23T08:25:00.000Z",
});

describe("bootstrap Lens diversity", () => {
  it("default bootstrap Lens outputs have distinct display orders", () => {
    const outputs = createDefaultPublicLensOutputs(
      bootstrapScope,
      bootstrapQuery,
      [
        publicEvent({
          id: "wikimedia:extended-mind",
          sourceFamily: "wikimedia",
          sourceName: "wikipedia",
          subject: "Extended mind",
          text: "Extended thought and extended mind theory.",
          createdAt: "2026-05-23T08:20:00.000Z",
        }),
        publicEvent({
          id: "wikimedia:distributed-cognition",
          sourceFamily: "wikimedia",
          sourceName: "wikipedia",
          subject: "Distributed cognition",
          text: "Distributed cognition studies how thought is spread across people and tools.",
          createdAt: "2026-05-23T08:20:00.000Z",
        }),
        publicEvent({
          id: "public_archive:intelligence-amplification",
          sourceFamily: "public_archive",
          sourceName: "internet_archive",
          subject: "Intelligence amplification",
          text: "Intelligence amplification explores computers as tools for extending thought.",
          createdAt: "2026-05-23T08:20:00.000Z",
        }),
        publicEvent({
          id: "scholarly_metadata:brain-computer-interface",
          sourceFamily: "scholarly_metadata",
          sourceName: "openalex",
          subject: "Brain-computer interface",
          text: "Brain-computer interface research studies brain augmentation and neurotechnology.",
          createdAt: "2026-05-23T08:20:00.000Z",
        }),
      ],
      "2026-05-23T08:30:00.000Z",
    );

    expect(outputs.map((output) => output.lensId)).toEqual([
      "atlas",
      "loom",
      "beacon",
      "prism",
    ]);
    expect(outputs.map((output) => output.sourceEventIds)).toEqual([
      [
        "wikimedia:extended-mind",
        "wikimedia:distributed-cognition",
        "public_archive:intelligence-amplification",
        "scholarly_metadata:brain-computer-interface",
      ],
      [
        "wikimedia:extended-mind",
        "public_archive:intelligence-amplification",
        "scholarly_metadata:brain-computer-interface",
        "wikimedia:distributed-cognition",
      ],
      [
        "scholarly_metadata:brain-computer-interface",
        "wikimedia:extended-mind",
        "wikimedia:distributed-cognition",
        "public_archive:intelligence-amplification",
      ],
      [
        "wikimedia:extended-mind",
        "scholarly_metadata:brain-computer-interface",
        "public_archive:intelligence-amplification",
        "wikimedia:distributed-cognition",
      ],
    ]);
    expect(findRedundantLensOutputs(outputs)).toMatchObject({
      redundantLensOutputIds: [],
    });
    expect(
      outputs.map((output) =>
        output.generation.parameters.find((parameter) => parameter.key === "ordering"),
      ),
    ).toEqual([
      { key: "ordering", value: "source_trail" },
      { key: "ordering", value: "source_family_interleave" },
      { key: "ordering", value: "scope_signal_strength" },
      { key: "ordering", value: "reciprocal_rank_fusion_with_source_diversity" },
    ]);
  });

  it("keeps Loom distinct when all active sources share one source family", () => {
    const outputs = createDefaultPublicLensOutputs(
      bootstrapScope,
      bootstrapQuery,
      [
        publicEvent({
          id: "wikimedia:augmented-cognition",
          sourceFamily: "wikimedia",
          sourceName: "wikipedia",
          subject: "Augmented cognition",
          text: "Augmented cognition supports extended thought.",
          createdAt: "2025-11-25T01:10:39.000Z",
        }),
        publicEvent({
          id: "wikimedia:distributed-cognition",
          sourceFamily: "wikimedia",
          sourceName: "wikipedia",
          subject: "Distributed cognition",
          text: "Distributed cognition studies extended mind and situated cognition.",
          createdAt: "2026-05-11T16:38:07.000Z",
        }),
        publicEvent({
          id: "wikimedia:intelligence-amplification",
          sourceFamily: "wikimedia",
          sourceName: "wikipedia",
          subject: "Intelligence amplification",
          text: "Intelligence amplification and brain-computer interface research support cognitive augmentation.",
          createdAt: "2026-04-20T11:08:26.000Z",
        }),
      ],
      "2026-05-23T08:30:00.000Z",
    );

    expect(outputs.map((output) => output.sourceEventIds)).toEqual([
      [
        "wikimedia:augmented-cognition",
        "wikimedia:distributed-cognition",
        "wikimedia:intelligence-amplification",
      ],
      [
        "wikimedia:augmented-cognition",
        "wikimedia:intelligence-amplification",
        "wikimedia:distributed-cognition",
      ],
      [
        "wikimedia:intelligence-amplification",
        "wikimedia:augmented-cognition",
        "wikimedia:distributed-cognition",
      ],
      [
        "wikimedia:distributed-cognition",
        "wikimedia:intelligence-amplification",
        "wikimedia:augmented-cognition",
      ],
    ]);
    expect(findRedundantLensOutputs(outputs)).toMatchObject({
      redundantLensOutputIds: [],
    });
    expect(
      outputs[1]?.generation.parameters.find(
        (parameter) => parameter.key === "ordering",
      ),
    ).toEqual({
      key: "ordering",
      value: "source_family_interleave_time_fallback",
    });
  });
});

function publicEvent(input: {
  id: string;
  sourceFamily: CanonicalEvent["provenance"]["sourceFamily"];
  sourceName: string;
  subject: string;
  text: string;
  createdAt: string;
}): CanonicalEvent {
  return {
    id: input.id,
    source: {
      platform:
        input.sourceFamily === "wikimedia" ? "wikimedia" : "public_archive",
      key: input.id,
      fingerprint: `${input.id}:fingerprint`,
      externalConversationId: input.id,
      externalMessageId: input.id,
      artifactId: null,
      externalParentId: null,
      canonicalParentEventId: null,
    },
    provenance: {
      sourceFamily: input.sourceFamily,
      sourceName: input.sourceName,
      upstreamSources: [],
      derivedFrom: [],
      retrievedAt: "2026-05-23T08:20:00.000Z",
      license: "test fixture",
    },
    time: {
      createdAt: input.createdAt,
      createdAtConfidence: "exact",
    },
    actor: {
      role: "other",
    },
    participants: [],
    content: {
      kind: "text",
      subject: input.subject,
      text: input.text,
    },
  };
}
