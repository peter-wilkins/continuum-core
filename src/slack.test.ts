import fixture from "./fixtures/slack-one-channel-message.json" with {
  type: "json",
};
import { describe, expect, it } from "vitest";

import {
  normalizeSlackChannelExport,
  normalizeSlackMessage,
  parseSlackChannelExport,
  type SlackMessageNormalizationInput,
} from "./index";

describe("Slack export import", () => {
  it("parses one Slack channel message", () => {
    expect(parseSlackChannelExport(fixture, { channelName: "general" })).toEqual({
      ok: true,
      value: [
        {
          type: "message",
          subtype: null,
          user: "U123",
          username: "ada",
          text: "The analytical engine needs better notes.",
          ts: "1779360123.000000",
          threadTs: "1779360123.000000",
          parentUserId: null,
          channelName: "general",
        },
      ],
    });
  });

  it("imports one Slack channel message into the canonical event model", () => {
    const parsed = parseSlackChannelExport(fixture, { channelName: "general" });

    if (!parsed.ok) {
      throw new Error("Fixture should parse.");
    }

    const event = normalizeSlackMessage({
      workspace: {
        name: "example-workspace",
      },
      channel: {
        name: "general",
      },
      message: parsed.value[0],
    } as SlackMessageNormalizationInput);

    expect(event).toMatchObject({
      id: "slack:general:1779360123.000000",
      source: {
        platform: "slack",
        key: "slack:general:1779360123.000000",
        externalConversationId: "1779360123.000000",
        externalMessageId: "general:1779360123.000000",
        artifactId: null,
        externalParentId: null,
        canonicalParentEventId: null,
      },
      provenance: {
        sourceFamily: "team_communications",
        sourceName: "slack",
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
          role: "author",
          name: "ada",
          address: "slack:U123",
        },
      ],
      content: {
        kind: "text",
        subject: "#general",
        text: "The analytical engine needs better notes.",
      },
    });
    expect(event.source.fingerprint).toMatch(/^[0-9a-f]{16}$/);
  });

  it("normalizes a Slack channel export", () => {
    const parsed = parseSlackChannelExport(fixture, { channelName: "general" });

    if (!parsed.ok) {
      throw new Error("Fixture should parse.");
    }

    const events = normalizeSlackChannelExport(parsed.value, {
      workspaceName: "example-workspace",
      channelName: "general",
    });

    expect(events).toHaveLength(1);
    expect(events[0]?.source.platform).toBe("slack");
    expect(events[0]?.content.subject).toBe("#general");
  });

  it("rejects Slack channel messages without timestamps", () => {
    expect(
      parseSlackChannelExport(
        [
          {
            type: "message",
            user: "U123",
            text: "Missing timestamp",
          },
        ],
        { channelName: "general" },
      ),
    ).toEqual({
      ok: false,
      errors: [
        {
          path: "0.ts",
          message: "Invalid input: expected string, received undefined",
        },
      ],
    });
  });
});
