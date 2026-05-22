import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { parseMboxText } from "./email-mbox";

const emailMboxFixturePath = fileURLToPath(
  new URL("./fixtures/email-one-message.mbox", import.meta.url),
);

describe("MBOX email parsing", () => {
  it("parses one MBOX email into the existing email normalization input", async () => {
    const raw = await readFile(emailMboxFixturePath, "utf8");
    const result = await parseMboxText(raw, {
      mailboxPath: "takeout/Mail/All mail Including Spam and Trash.mbox",
    });

    expect(result).toMatchObject({
      messagesSeen: 1,
      messagesParsed: 1,
      quarantine: [],
      messages: [
        {
          mailbox: {
            path: "takeout/Mail/All mail Including Spam and Trash.mbox",
          },
          message: {
            messageId: "<quote-456@example.com>",
            date: "2026-05-21T10:42:03.000Z",
            from: {
              name: "Peter Wilkins",
              address: "peter@example.com",
            },
            to: [
              {
                name: "Bob",
                address: "bob@example.com",
              },
            ],
            cc: [],
            bcc: [],
            replyTo: [],
            subject: "Boiler quote",
            textBody: "Need to quote Bob for the boiler.",
            inReplyTo: ["<quote-123@example.com>"],
            references: ["<quote-123@example.com>"],
            attachmentCount: 0,
          },
        },
      ],
    });
  });

  it("quarantines one malformed MBOX email and continues parsing", async () => {
    const result = await parseMboxText(
      [
        "From bad@example.com Thu May 21 10:42:03 2026",
        "Date: not a date",
        "From: Bad <bad@example.com>",
        "Subject: Broken",
        "",
        "No Message-ID here.",
        "From peter@example.com Thu May 21 10:42:03 2026",
        "Message-ID: <quote-456@example.com>",
        "Date: Thu, 21 May 2026 10:42:03 +0000",
        "From: Peter Wilkins <peter@example.com>",
        "To: Bob <bob@example.com>",
        "Subject: Boiler quote",
        "",
        "Need to quote Bob for the boiler.",
      ].join("\n"),
      {
        mailboxPath: "mail/export.mbox",
      },
    );

    expect(result.messagesSeen).toBe(2);
    expect(result.messagesParsed).toBe(1);
    expect(result.quarantine).toMatchObject([
      {
        sourcePath: "mail/export.mbox",
        recordIndex: 0,
        errorCode: "email_mbox_parse_failed",
        recoverable: true,
      },
    ]);
  });
});
