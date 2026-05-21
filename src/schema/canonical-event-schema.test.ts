import { describe, expect, it } from "vitest";

import { canonicalEventSchema } from "./canonical-event-schema";

describe("canonical event schema descriptor", () => {
  it("describes the fields currently produced by the ChatGPT normalizer", () => {
    const fieldNames = canonicalEventSchema.sections.flatMap((section) =>
      section.fields.map((field) => `${section.name}.${field.name}`),
    );

    expect(fieldNames).toEqual([
      "source.platform",
      "source.externalConversationId",
      "source.externalMessageId",
      "source.externalParentId",
      "source.canonicalParentEventId",
      "time.createdAt",
      "time.createdAtConfidence",
      "actor.role",
      "content.kind",
      "content.text",
    ]);
  });
});
