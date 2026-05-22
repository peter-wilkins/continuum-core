import { describe, expect, it } from "vitest";
import claudeFixture from "./fixtures/claude-one-conversation.json" with {
  type: "json",
};
import emailFixture from "./fixtures/email-one-message.json" with {
  type: "json",
};
import mediaWikiFixture from "./fixtures/mediawiki-one-revision.json" with {
  type: "json",
};
import wikidataFixture from "./fixtures/wikidata-ada-lovelace-entity.json" with {
  type: "json",
};

import {
  type ClaudeConversationExport,
  type EmailMessageNormalizationInput,
  type MediaWikiRevisionNormalizationInput,
  type WikidataEntityNormalizationInput,
  canonicalEventToLocalSourceCacheEventRow,
  createImportedEntryFromCanonicalEvent,
  mergeCanonicalEvents,
  continuumCorePackageName,
  describeContinuumCorePackage,
  normalizeClaudeConversations,
  normalizeChatGptMessage,
  normalizeEmailMessage,
  normalizeMediaWikiRevision,
  normalizeWikidataEntity,
} from "./index";

describe("continuum core package scaffold", () => {
  it("exports from the public entrypoint", () => {
    expect(continuumCorePackageName).toBe("@continuum/core");
    expect(describeContinuumCorePackage()).toEqual({
      name: "@continuum/core",
    });
  });
});

describe("Local Source Cache", () => {
  it("maps a Canonical Event into a Local Source Cache row", () => {
    const event = normalizeChatGptMessage({
      conversation: {
        id: "conv_123",
        title: "Boiler quote",
        create_time: 1779360000,
        update_time: 1779360300,
      },
      node: {
        id: "msg_456",
        parent: "msg_parent",
        children: [],
        message: {
          id: "msg_456",
          create_time: 1779360123,
          author: { role: "user" },
          content: {
            content_type: "text",
            parts: ["Need to quote Bob for the boiler."],
          },
        },
      },
    });

    const row = canonicalEventToLocalSourceCacheEventRow(
      event,
      "2026-05-21T19:55:00.000Z",
    );

    expect(row).toEqual({
      id: "chatgpt:conv_123:msg_456",
      sourcePlatform: "chatgpt",
      sourceName: "chatgpt",
      sourceKey: "chatgpt:conv_123:msg_456",
      externalConversationId: "conv_123",
      externalMessageId: "msg_456",
      createdAt: "2026-05-21T10:42:03.000Z",
      createdAtConfidence: "exact",
      ingestedAt: "2026-05-21T19:55:00.000Z",
      actorRole: "user",
      subject: null,
      text: "Need to quote Bob for the boiler.",
      eventJson: JSON.stringify(event),
    });
    expect(JSON.parse(row.eventJson)).toEqual(event);
  });
});

describe("ChatGPT import normalization", () => {
  it("imports one ChatGPT event into the canonical event model", () => {
    const event = normalizeChatGptMessage({
      conversation: {
        id: "conv_123",
        title: "Boiler quote",
        create_time: 1779360000,
        update_time: 1779360300,
      },
      node: {
        id: "msg_456",
        parent: "msg_parent",
        children: [],
        message: {
          id: "msg_456",
          create_time: 1779360123,
          author: { role: "user" },
          content: {
            content_type: "text",
            parts: ["Need to quote Bob for the boiler."],
          },
        },
      },
    });

    expect(event.id).toBe("chatgpt:conv_123:msg_456");
    expect(event.actor.role).toBe("user");
    expect(event.participants).toEqual([]);
    expect(event.content.text).toBe("Need to quote Bob for the boiler.");
    expect(event.content.subject).toBeNull();
    expect(event.source.platform).toBe("chatgpt");
    expect(event.source.key).toBe("chatgpt:conv_123:msg_456");
    expect(event.source.fingerprint).toMatch(/^[0-9a-f]{16}$/);
    expect(event.source.externalConversationId).toBe("conv_123");
    expect(event.source.externalMessageId).toBe("msg_456");
    expect(event.source.externalParentId).toBe("msg_parent");
    expect(event.source.canonicalParentEventId).toBeNull();
    expect(event.time.createdAt).toBe("2026-05-21T10:42:03.000Z");
    expect(event.time.createdAtConfidence).toBe("exact");
  });

  it("imports one ChatGPT assistant response into the canonical event model", () => {
    const event = normalizeChatGptMessage({
      conversation: {
        id: "conv_123",
        title: "Boiler quote",
        create_time: 1779360000,
        update_time: 1779360300,
      },
      node: {
        id: "msg_789",
        parent: "msg_456",
        children: [],
        message: {
          id: "msg_789",
          create_time: 1779360180,
          author: { role: "assistant" },
          content: {
            content_type: "text",
            parts: ["You should ask Bob whether the boiler is combi or system."],
          },
        },
      },
    });

    expect(event.id).toBe("chatgpt:conv_123:msg_789");
    expect(event.actor.role).toBe("assistant");
    expect(event.content.text).toBe(
      "You should ask Bob whether the boiler is combi or system.",
    );
    expect(event.source.externalParentId).toBe("msg_456");
    expect(event.source.canonicalParentEventId).toBeNull();
  });

  it("imports one ChatGPT system event into the canonical event model", () => {
    const event = normalizeChatGptMessage({
      conversation: {
        id: "conv_123",
        title: "Boiler quote",
        create_time: 1779360000,
        update_time: 1779360300,
      },
      node: {
        id: "msg_system",
        parent: "msg_root",
        children: [],
        message: {
          id: "msg_system",
          create_time: 1779360060,
          author: { role: "system" },
          content: {
            content_type: "text",
            parts: ["You are ChatGPT."],
          },
        },
      },
    });

    expect(event.id).toBe("chatgpt:conv_123:msg_system");
    expect(event.actor.role).toBe("system");
    expect(event.content.text).toBe("You are ChatGPT.");
    expect(event.source.externalParentId).toBe("msg_root");
    expect(event.source.canonicalParentEventId).toBeNull();
  });

  it("imports one ChatGPT tool event into the canonical event model", () => {
    const event = normalizeChatGptMessage({
      conversation: {
        id: "conv_123",
        title: "Boiler quote",
        create_time: 1779360000,
        update_time: 1779360300,
      },
      node: {
        id: "msg_tool",
        parent: "msg_789",
        children: [],
        message: {
          id: "msg_tool",
          create_time: 1779360240,
          author: { role: "tool" },
          content: {
            content_type: "text",
            parts: ["{\"query\":\"boiler types\"}"],
          },
        },
      },
    });

    expect(event.id).toBe("chatgpt:conv_123:msg_tool");
    expect(event.actor.role).toBe("tool");
    expect(event.content.text).toBe("{\"query\":\"boiler types\"}");
    expect(event.source.externalParentId).toBe("msg_789");
    expect(event.source.canonicalParentEventId).toBeNull();
  });

  it("reports known ChatGPT events instead of importing duplicates", () => {
    const event = normalizeChatGptMessage({
      conversation: {
        id: "conv_123",
        title: "Boiler quote",
        create_time: 1779360000,
        update_time: 1779360300,
      },
      node: {
        id: "msg_456",
        parent: "msg_parent",
        children: [],
        message: {
          id: "msg_456",
          create_time: 1779360123,
          author: { role: "user" },
          content: {
            content_type: "text",
            parts: ["Need to quote Bob for the boiler."],
          },
        },
      },
    });

    const result = mergeCanonicalEvents([event], [event]);

    expect(result.events).toEqual([event]);
    expect(result.report).toEqual({
      new: 0,
      known: 1,
      changed: 0,
      uncertain: 0,
    });
  });

  it("reports changed ChatGPT source records without overwriting existing events", () => {
    const existing = normalizeChatGptMessage({
      conversation: {
        id: "conv_123",
        title: "Boiler quote",
        create_time: 1779360000,
        update_time: 1779360300,
      },
      node: {
        id: "msg_456",
        parent: "msg_parent",
        children: [],
        message: {
          id: "msg_456",
          create_time: 1779360123,
          author: { role: "user" },
          content: {
            content_type: "text",
            parts: ["Need to quote Bob for the boiler."],
          },
        },
      },
    });
    const changed = normalizeChatGptMessage({
      conversation: {
        id: "conv_123",
        title: "Boiler quote",
        create_time: 1779360000,
        update_time: 1779360300,
      },
      node: {
        id: "msg_456",
        parent: "msg_parent",
        children: [],
        message: {
          id: "msg_456",
          create_time: 1779360123,
          author: { role: "user" },
          content: {
            content_type: "text",
            parts: ["Need to quote Bob for the boiler. Edited text."],
          },
        },
      },
    });

    const result = mergeCanonicalEvents([existing], [changed]);

    expect(result.events).toEqual([existing]);
    expect(result.report).toEqual({
      new: 0,
      known: 0,
      changed: 1,
      uncertain: 0,
    });
  });
});

describe("Email import normalization", () => {
  it("imports one RFC email message into the canonical event model", () => {
    const event = normalizeEmailMessage(
      emailFixture as EmailMessageNormalizationInput,
    );

    expect(event).toMatchObject({
      id: "email:<quote-456@example.com>",
      source: {
        platform: "email",
        key: "email:<quote-456@example.com>",
        externalConversationId: "<quote-123@example.com>",
        externalMessageId: "<quote-456@example.com>",
        externalParentId: "<quote-123@example.com>",
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
        {
          role: "recipient",
          name: "Bob",
          address: "bob@example.com",
        },
      ],
      content: {
        kind: "text",
        subject: "Boiler quote",
        text: "Need to quote Bob for the boiler.",
      },
    });
    expect(event.source.fingerprint).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe("Wikimedia import normalization", () => {
  it("imports one Wikidata entity into the canonical event model", () => {
    const event = normalizeWikidataEntity(
      wikidataFixture as WikidataEntityNormalizationInput,
    );

    expect(event).toMatchObject({
      id: "wikidata:Q7259",
      source: {
        platform: "wikimedia",
        key: "wikidata:Q7259",
        externalConversationId: "wikidata:Q7259",
        externalMessageId: "2495481811",
        artifactId: "wikidata:Q7259",
        externalParentId: null,
        canonicalParentEventId: null,
      },
      provenance: {
        sourceFamily: "wikimedia",
        sourceName: "wikidata",
        upstreamSources: ["wikimedia"],
        derivedFrom: [],
        retrievedAt: "unknown",
        license: "CC0",
      },
      time: {
        createdAt: "2026-05-21T12:08:07.000Z",
        createdAtConfidence: "exact",
      },
      actor: {
        role: "other",
      },
      participants: [],
      content: {
        kind: "text",
        subject: "Ada Lovelace",
        text: [
          "Ada Lovelace",
          "English mathematician (1815-1852)",
          "Aliases: Lady Ada; Augusta Ada Byron",
          "Wikidata entity: Q7259",
        ].join("\n"),
      },
    });
    expect(event.source.fingerprint).toMatch(/^[0-9a-f]{16}$/);
  });

  it("imports one MediaWiki page revision into the canonical event model", () => {
    const event = normalizeMediaWikiRevision(
      mediaWikiFixture as MediaWikiRevisionNormalizationInput,
    );

    expect(event).toMatchObject({
      id: "en.wikipedia.org:revision:67890",
      source: {
        platform: "wikimedia",
        key: "en.wikipedia.org:revision:67890",
        externalConversationId: "en.wikipedia.org:page:12345",
        externalMessageId: "67890",
        artifactId: "en.wikipedia.org:page:12345",
        externalParentId: "67889",
        canonicalParentEventId: null,
      },
      time: {
        createdAt: "2026-05-21T10:42:03.000Z",
        createdAtConfidence: "exact",
      },
      actor: {
        role: "other",
      },
      participants: [],
      content: {
        kind: "text",
        subject: "Boiler",
        text: "Add maintenance note",
      },
    });
    expect(event.source.fingerprint).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe("Imported Entry creation", () => {
  it("creates Imported Entries from Canonical Events", () => {
    const canonicalEvent = normalizeChatGptMessage({
      conversation: {
        id: "conv_123",
        title: "Boiler quote",
        create_time: 1779360000,
        update_time: 1779360300,
      },
      node: {
        id: "msg_456",
        parent: "msg_parent",
        children: [],
        message: {
          id: "msg_456",
          create_time: 1779360123,
          author: { role: "user" },
          content: {
            content_type: "text",
            parts: ["Need to quote Bob for the boiler."],
          },
        },
      },
    });

    expect(createImportedEntryFromCanonicalEvent(canonicalEvent)).toEqual({
      id: "entry:chatgpt:conv_123:msg_456",
      canonicalEventId: "chatgpt:conv_123:msg_456",
      source: canonicalEvent.source,
      provenance: canonicalEvent.provenance,
      captureContext: {
        capturedAt: "2026-05-21T10:42:03.000Z",
        contextClues: [],
      },
      time: {
        occurredAt: "2026-05-21T10:42:03.000Z",
        occurredAtConfidence: "exact",
      },
      actor: {
        role: "user",
      },
      participants: [],
      content: {
        kind: "text",
        subject: null,
        text: "Need to quote Bob for the boiler.",
      },
    });
  });
});

describe("Claude import normalization", () => {
  it("imports one Claude exchange into the same canonical event model", () => {
    const events = normalizeClaudeConversations(
      claudeFixture as ClaudeConversationExport[],
    );

    expect(events).toHaveLength(2);
    expect(events).toMatchObject([
      {
        id: "claude:claude_conv_123:claude_msg_456",
        source: {
          platform: "claude",
          key: "claude:claude_conv_123:claude_msg_456",
          externalConversationId: "claude_conv_123",
          externalMessageId: "claude_msg_456",
          externalParentId: null,
          canonicalParentEventId: null,
        },
        time: {
          createdAt: "2026-05-21T10:42:03.000Z",
          createdAtConfidence: "exact",
        },
        actor: {
          role: "user",
        },
        content: {
          kind: "text",
          text: "Need to quote Bob for the boiler.",
        },
      },
      {
        id: "claude:claude_conv_123:claude_msg_789",
        source: {
          platform: "claude",
          key: "claude:claude_conv_123:claude_msg_789",
          externalConversationId: "claude_conv_123",
          externalMessageId: "claude_msg_789",
          externalParentId: "claude_msg_456",
          canonicalParentEventId: null,
        },
        time: {
          createdAt: "2026-05-21T10:43:00.000Z",
          createdAtConfidence: "exact",
        },
        actor: {
          role: "assistant",
        },
        content: {
          kind: "text",
          text: "You should ask Bob whether the boiler is combi or system.",
        },
      },
    ]);
    expect(events[0]?.source.fingerprint).toMatch(/^[0-9a-f]{16}$/);
    expect(events[1]?.source.fingerprint).toMatch(/^[0-9a-f]{16}$/);
  });
});
