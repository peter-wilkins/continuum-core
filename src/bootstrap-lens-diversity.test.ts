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
        }),
        publicEvent({
          id: "wikimedia:distributed-cognition",
          sourceFamily: "wikimedia",
          sourceName: "wikipedia",
          subject: "Distributed cognition",
          text: "Distributed cognition studies how thought is spread across people and tools.",
        }),
        publicEvent({
          id: "public_archive:intelligence-amplification",
          sourceFamily: "public_archive",
          sourceName: "internet_archive",
          subject: "Intelligence amplification",
          text: "Intelligence amplification explores computers as tools for extending thought.",
        }),
        publicEvent({
          id: "scholarly_metadata:brain-computer-interface",
          sourceFamily: "scholarly_metadata",
          sourceName: "openalex",
          subject: "Brain-computer interface",
          text: "Brain-computer interface research studies brain augmentation and neurotechnology.",
        }),
      ],
      "2026-05-23T08:30:00.000Z",
    );

    expect(outputs.map((output) => output.lensId)).toEqual([
      "atlas",
      "loom",
      "beacon",
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
    ]);
  });
});

function publicEvent(input: {
  id: string;
  sourceFamily: CanonicalEvent["provenance"]["sourceFamily"];
  sourceName: string;
  subject: string;
  text: string;
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
      createdAt: "2026-05-23T08:20:00.000Z",
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
