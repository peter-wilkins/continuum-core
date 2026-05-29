import { describe, expect, it } from "vitest";

import {
  applySecretSpillMembraneToCanonicalEvent,
  applySecretSpillMembrane,
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
  provenance: {
    sourceFamily: "personal_communications",
    sourceName: "email_mbox",
    upstreamSources: [],
    derivedFrom: [],
    retrievedAt: "unknown",
    license: null,
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
  it("redacts a pasted Supabase token before text enters the store", () => {
    const pastedToken = `sbp_${"a".repeat(40)}`;

    const result = applySecretSpillMembrane({
      text: `Please use ${pastedToken} for the Supabase MCP.`,
      fallbackClassification: "private",
      checkedAt: "2026-05-24T11:45:00.000Z",
    });

    expect(result.text).toBe(
      "Please use [REDACTED_SUPABASE_PAT] for the Supabase MCP.",
    );
    expect(result.text).not.toContain(pastedToken);
    expect(result.classification).toBe("secret");
    expect(result.decision).toEqual({
      action: "redacted",
      reason: "secret_detected",
      classification: "secret",
      decidedAt: "2026-05-24T11:45:00.000Z",
      findingCount: 1,
    });
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({
      kind: "supabase_personal_access_token",
      startIndex: 11,
      endIndex: 55,
      redaction: "[REDACTED_SUPABASE_PAT]",
    });
    expect(result.findings[0]?.fingerprint).toMatch(/^sha256:/);
    expect(result.findings[0]?.fingerprint).not.toContain(pastedToken);
  });

  it("allows ordinary text through the secret spill membrane unchanged", () => {
    const result = applySecretSpillMembrane({
      text: "Please make the app kinder when humans make mistakes.",
      fallbackClassification: "private",
      checkedAt: "2026-05-24T11:46:00.000Z",
    });

    expect(result).toEqual({
      text: "Please make the app kinder when humans make mistakes.",
      classification: "private",
      findings: [],
      decision: {
        action: "allowed",
        reason: "no_secret_detected",
        classification: "private",
        decidedAt: "2026-05-24T11:46:00.000Z",
        findingCount: 0,
      },
    });
  });

  it("redacts a secret spill from a Canonical Event and returns a recovery quarantine record", () => {
    const pastedToken = `sbp_${"b".repeat(40)}`;
    const result = applySecretSpillMembraneToCanonicalEvent({
      event: {
        ...privateEmailEvent,
        content: {
          ...privateEmailEvent.content,
          text: `Use ${pastedToken} for AFK MCP.`,
        },
      },
      fallbackClassification: "private",
      checkedAt: "2026-05-24T11:47:00.000Z",
      sourcePath: "codex-chat",
      recordIndex: 0,
    });

    expect(result.event.content.text).toBe(
      "Use [REDACTED_SUPABASE_PAT] for AFK MCP.",
    );
    expect(result.event.content.text).not.toContain(pastedToken);
    expect(result.classification).toBe("secret");
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({
      field: "text",
      kind: "supabase_personal_access_token",
      redaction: "[REDACTED_SUPABASE_PAT]",
    });
    expect(result.quarantine).toMatchObject({
      sourcePath: "codex-chat",
      recordIndex: 0,
      errorCode: "secret_spill_redacted",
      recoverable: true,
    });
    expect(result.quarantine?.message).toContain("Rotate the credential");
    expect(result.quarantine?.message).not.toContain(pastedToken);
  });

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
