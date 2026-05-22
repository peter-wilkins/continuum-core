import { describe, expect, it } from "vitest";

import {
  createLensFeedbackSignal,
  type LensFeedbackSignal,
} from "./index";

describe("Lens feedback", () => {
  it("records a signed-in user's preferred Lens for one query and scope", () => {
    const signal = createLensFeedbackSignal({
      id: "lens-feedback:001",
      userId: "user:123",
      scopeId: "scope:ada-lovelace-through-computing",
      queryId: "query:ada-lovelace-contribution",
      selectedLensOutputId: "lens-output:ada-computing:atlas:v1",
      candidateLensOutputIds: [
        "lens-output:ada-computing:atlas:v1",
        "lens-output:ada-computing:loom:v1",
        "lens-output:ada-computing:beacon:v1",
      ],
      signal: "preferred",
      createdAt: "2026-05-22T12:20:00.000Z",
    });

    expect(signal).toEqual<LensFeedbackSignal>({
      id: "lens-feedback:001",
      userId: "user:123",
      scopeId: "scope:ada-lovelace-through-computing",
      queryId: "query:ada-lovelace-contribution",
      selectedLensOutputId: "lens-output:ada-computing:atlas:v1",
      candidateLensOutputIds: [
        "lens-output:ada-computing:atlas:v1",
        "lens-output:ada-computing:loom:v1",
        "lens-output:ada-computing:beacon:v1",
      ],
      signal: "preferred",
      createdAt: "2026-05-22T12:20:00.000Z",
    });
  });

  it("rejects Lens feedback when the selected Lens was not in the candidate set", () => {
    expect(() =>
      createLensFeedbackSignal({
        id: "lens-feedback:bad",
        userId: "user:123",
        scopeId: "scope:ada-lovelace-through-computing",
        queryId: "query:ada-lovelace-contribution",
        selectedLensOutputId: "lens-output:ada-computing:atlas:v1",
        candidateLensOutputIds: ["lens-output:ada-computing:loom:v1"],
        signal: "preferred",
        createdAt: "2026-05-22T12:20:00.000Z",
      }),
    ).toThrow("LensFeedback selectedLensOutputId must be in candidateLensOutputIds.");
  });
});
