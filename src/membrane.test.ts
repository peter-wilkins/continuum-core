import { describe, expect, it } from "vitest";

import {
  applyErasureRequest,
  discloseThroughMembrane,
  protectPayload,
  readProtectedPayload,
  type CanonicalEvent,
} from "./index";

const privateEmailEvent: CanonicalEvent = {
  id: "email:<private-1@example.com>",
  source: {
    platform: "email",
    key: "email:<private-1@example.com>",
    fingerprint: "feedfacecafebeef",
    externalConversationId: "<thread-1@example.com>",
    externalMessageId: "<private-1@example.com>",
    artifactId: null,
    externalParentId: null,
    canonicalParentEventId: null,
  },
  time: {
    createdAt: "2026-05-21T10:42:03.000Z",
    createdAtConfidence: "exact",
  },
  actor: {
    role: "other",
  },
  participants: [
    {
      role: "sender",
      name: "Peter Wilkins",
      address: "peter@example.com",
    },
  ],
  content: {
    kind: "text",
    subject: "Private boiler quote",
    text: "My secret boiler account code is SECRET-123.",
  },
};

describe("privacy membranes", () => {
  it("erases protected payloads while preserving an immutable tombstone", () => {
    const protectedPayload = protectPayload({
      id: "payload_private_1",
      plaintext: privateEmailEvent.content.text,
      classification: "private",
      createdAt: "2026-05-21T10:42:03.000Z",
    });

    expect(readProtectedPayload(protectedPayload)).toEqual({
      status: "available",
      plaintext: "My secret boiler account code is SECRET-123.",
    });

    const erasedPayload = applyErasureRequest(protectedPayload, {
      requestedAt: "2026-05-21T11:00:00.000Z",
      reason: "user_request",
    });

    expect(readProtectedPayload(erasedPayload)).toEqual({
      status: "erased",
      plaintext: null,
    });
    expect(erasedPayload.erasure).toEqual({
      status: "erased",
      requestedAt: "2026-05-21T11:00:00.000Z",
      reason: "user_request",
    });
  });

  it("blocks erased content at the disclosure membrane", () => {
    const erasedPayload = applyErasureRequest(
      protectPayload({
        id: "payload_private_1",
        plaintext: privateEmailEvent.content.text,
        classification: "private",
        createdAt: "2026-05-21T10:42:03.000Z",
      }),
      {
        requestedAt: "2026-05-21T11:00:00.000Z",
        reason: "user_request",
      },
    );

    const result = discloseThroughMembrane({
      events: [privateEmailEvent],
      payloadsByEventId: {
        [privateEmailEvent.id]: erasedPayload,
      },
      requestedAt: "2026-05-21T11:01:00.000Z",
      purpose: "export",
    });

    expect(result.events).toHaveLength(0);
    expect(result.decisions).toEqual([
      {
        eventId: privateEmailEvent.id,
        action: "blocked",
        reason: "payload_erased",
        decidedAt: "2026-05-21T11:01:00.000Z",
        purpose: "export",
      },
    ]);
  });
});
