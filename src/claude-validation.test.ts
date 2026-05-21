import { describe, expect, it } from "vitest";

import {
  normalizeClaudeConversations,
  parseClaudeConversations,
  parseClaudeConversationsWithQuarantine,
} from "./index";

describe("Claude source validation", () => {
  it("validates Claude export JSON before normalizing events", () => {
    const result = parseClaudeConversations([
      {
        uuid: "claude_conv_1",
        name: "Boiler quote",
        summary: "Discuss boiler quote.",
        created_at: "2026-05-21T10:40:00.000Z",
        updated_at: "2026-05-21T10:45:00.000Z",
        account: { uuid: "account_1" },
        chat_messages: [
          {
            uuid: "claude_msg_1",
            sender: "human",
            text: "Need to quote Bob for the boiler.",
            created_at: "2026-05-21T10:42:03.000Z",
            updated_at: "2026-05-21T10:42:04.000Z",
            parent_message_uuid: "00000000-0000-4000-8000-000000000000",
            content: [{ type: "text", text: "Need to quote Bob for the boiler." }],
            attachments: [],
            files: [],
          },
        ],
      },
    ]);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected Claude validation to pass.");
    }

    const events = normalizeClaudeConversations(result.value);

    expect(events[0]?.source.externalParentId).toBe(
      "00000000-0000-4000-8000-000000000000",
    );
  });

  it("returns readable validation errors for malformed Claude records", () => {
    const result = parseClaudeConversations([
      {
        uuid: "claude_conv_1",
        name: "Boiler quote",
        summary: "Discuss boiler quote.",
        created_at: "not-a-date",
        updated_at: "2026-05-21T10:45:00.000Z",
        account: { uuid: "account_1" },
        chat_messages: [
          {
            uuid: "claude_msg_1",
            sender: "robot",
            text: "Need to quote Bob for the boiler.",
            created_at: "2026-05-21T10:42:03.000Z",
            updated_at: "2026-05-21T10:42:04.000Z",
            parent_message_uuid: null,
            content: [],
            attachments: [],
            files: [],
          },
        ],
      },
    ]);

    expect(result).toEqual({
      ok: false,
      errors: [
        {
          path: "0.created_at",
          message: "Invalid ISO datetime",
        },
        {
          path: "0.chat_messages.0.sender",
          message: "Invalid option: expected one of \"human\"|\"assistant\"",
        },
      ],
    });
  });

  it("quarantines malformed Claude conversations while preserving valid ones", () => {
    const result = parseClaudeConversationsWithQuarantine([
      {
        uuid: "claude_conv_1",
        name: "Valid",
        summary: null,
        created_at: "2026-05-21T10:40:00.000Z",
        updated_at: "2026-05-21T10:45:00.000Z",
        account: { uuid: "account_1" },
        chat_messages: [],
      },
      {
        uuid: "claude_conv_2",
        name: "Invalid",
        summary: null,
        created_at: "not-a-date",
        updated_at: "2026-05-21T10:45:00.000Z",
        account: { uuid: "account_1" },
        chat_messages: [],
      },
    ]);

    expect(result.conversations).toHaveLength(1);
    expect(result.quarantine).toEqual([
      {
        sourcePath: "1",
        recordIndex: 1,
        errorCode: "source_validation_failed",
        message: "1.created_at: Invalid ISO datetime",
        recoverable: true,
      },
    ]);
  });
});
