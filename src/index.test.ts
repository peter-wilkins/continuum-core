import { describe, expect, it } from "vitest";

import {
  continuumCorePackageName,
  describeContinuumCorePackage,
  normalizeChatGptMessage,
} from "./index";

describe("continuum core package scaffold", () => {
  it("exports from the public entrypoint", () => {
    expect(continuumCorePackageName).toBe("@continuum/core");
    expect(describeContinuumCorePackage()).toEqual({
      name: "@continuum/core",
    });
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
    expect(event.content.text).toBe("Need to quote Bob for the boiler.");
    expect(event.source.platform).toBe("chatgpt");
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
});
