import { describe, expect, it } from "vitest";

import {
  buildEmailEngagementIndex,
  createMemoryActiveImportedEntries,
  debugRankingProfiles,
  evaluateCanonicalEventImportProfile,
  evaluateEmailImportProfile,
  normalizeChatGptMessage,
  retrieveContinuationCandidates,
  summarizeImportFilterDecisions,
  type EmailMessageNormalizationInput,
  type ImportFilterDecision,
} from "./index";

const myAddresses = ["peter@example.com"];

function email(input: {
  id: string;
  from: string;
  to: string[];
  subject: string;
  text?: string;
  headers?: Record<string, string>;
  references?: string[];
  inReplyTo?: string[];
}): EmailMessageNormalizationInput {
  return {
    mailbox: {
      path: "gmail.mbox",
    },
    message: {
      messageId: input.id,
      date: "Thu, 21 May 2026 10:42:03 +0000",
      from: { name: null, address: input.from },
      to: input.to.map((address) => ({ name: null, address })),
      cc: [],
      bcc: [],
      replyTo: [],
      subject: input.subject,
      textBody: input.text ?? "Body",
      inReplyTo: input.inReplyTo ?? [],
      references: input.references ?? [],
      attachmentCount: 0,
      headers: input.headers ?? {},
    },
  };
}

describe("import profiles", () => {
  it("routes uncertain canonical events to needs review in intentional context", () => {
    const event = normalizeChatGptMessage({
      conversation: {
        id: "conv_uncertain",
        title: "Unknown import",
        create_time: 1779360000,
        update_time: 1779360300,
      },
      node: {
        id: "msg_uncertain",
        parent: "root",
        children: [],
        message: {
          id: "msg_uncertain",
          create_time: 1779360123,
          author: { role: "user" },
          content: {
            content_type: "text",
            parts: ["This event has no source-specific curation rule yet."],
          },
        },
      },
    });

    expect(
      evaluateCanonicalEventImportProfile({
        profile: "intentional_context",
        event,
      }),
    ).toEqual({
      action: "needs_review",
      reason: "uncertain_intent",
      confidence: 0.6,
    });
  });

  it("keeps needs-review import records local but inactive for retrieval", () => {
    const included = normalizeChatGptMessage({
      conversation: {
        id: "conv_123",
        title: "Boiler quote",
        create_time: 1779360000,
        update_time: 1779360300,
      },
      node: {
        id: "msg_boiler",
        parent: "root",
        children: [],
        message: {
          id: "msg_boiler",
          create_time: 1779360123,
          author: { role: "user" },
          content: {
            content_type: "text",
            parts: ["Need to quote Bob for the boiler."],
          },
        },
      },
    });
    const needsReview = normalizeChatGptMessage({
      conversation: {
        id: "conv_456",
        title: "Sea turtles",
        create_time: 1779360000,
        update_time: 1779360300,
      },
      node: {
        id: "msg_turtles",
        parent: "root",
        children: [],
        message: {
          id: "msg_turtles",
          create_time: 1779360180,
          author: { role: "user" },
          content: {
            content_type: "text",
            parts: ["Watched another sea turtle video."],
          },
        },
      },
    });
    const excluded = normalizeChatGptMessage({
      conversation: {
        id: "conv_789",
        title: "Promotions",
        create_time: 1779360000,
        update_time: 1779360300,
      },
      node: {
        id: "msg_promo",
        parent: "root",
        children: [],
        message: {
          id: "msg_promo",
          create_time: 1779360240,
          author: { role: "user" },
          content: {
            content_type: "text",
            parts: ["Bulk promotional noise."],
          },
        },
      },
    });
    const decisions: ImportFilterDecision[] = [
      {
        action: "include",
        reason: "profile_everything",
        confidence: 1,
      },
      {
        action: "needs_review",
        reason: "weak_passive_activity",
        confidence: 0.8,
      },
      {
        action: "exclude",
        reason: "no_prior_engagement",
        confidence: 0.8,
      },
    ];

    const entries = createMemoryActiveImportedEntries({
      events: [included, needsReview, excluded],
      decisions,
    });
    const candidates = retrieveContinuationCandidates({
      resumeRequest: {
        text: "sea turtles",
        requestedAt: "2026-05-21T12:00:00.000Z",
      },
      rankingProfile: debugRankingProfiles.balanced,
      entries,
    });

    expect(entries.map((entry) => entry.canonicalEventId)).toEqual([included.id]);
    const supportingEntryIds = candidates.flatMap(
      (candidate) => candidate.supportingEntryIds,
    );
    expect(supportingEntryIds).not.toContain(`entry:${needsReview.id}`);
    expect(supportingEntryIds).not.toContain(`entry:${excluded.id}`);
    expect(summarizeImportFilterDecisions(decisions)).toEqual({
      included: 1,
      excluded: 1,
      needsReview: 1,
      reasons: {
        no_prior_engagement: 1,
        profile_everything: 1,
        weak_passive_activity: 1,
      },
    });
  });

  it("imports engaged-contact email and excludes unreplied or promotional email", () => {
    const messages = [
      email({
        id: "<sent-1@example.com>",
        from: "peter@example.com",
        to: ["alice@example.com"],
        subject: "Re: Boiler quote",
        inReplyTo: ["<alice-1@example.com>"],
        references: ["<alice-1@example.com>"],
      }),
      email({
        id: "<alice-2@example.com>",
        from: "alice@example.com",
        to: ["peter@example.com"],
        subject: "Re: Boiler quote",
        references: ["<alice-1@example.com>"],
      }),
      email({
        id: "<stranger-1@example.com>",
        from: "stranger@example.com",
        to: ["peter@example.com"],
        subject: "Hello",
      }),
      email({
        id: "<promo-1@example.com>",
        from: "offers@example.com",
        to: ["peter@example.com"],
        subject: "50% off boiler parts",
        headers: {
          "List-Unsubscribe": "<https://example.com/unsubscribe>",
          Precedence: "bulk",
        },
      }),
    ];
    const engagement = buildEmailEngagementIndex(messages, myAddresses);
    const decisions = messages.map((message) =>
      evaluateEmailImportProfile({
        profile: "intentional_context",
        message,
        engagement,
        myAddresses,
      }),
    );

    expect(decisions).toEqual([
      {
        action: "include",
        reason: "sent_by_user",
        confidence: 1,
      },
      {
        action: "include",
        reason: "replied_contact",
        confidence: 0.95,
      },
      {
        action: "exclude",
        reason: "no_prior_engagement",
        confidence: 0.8,
      },
      {
        action: "exclude",
        reason: "promotional_or_bulk",
        confidence: 0.95,
      },
    ]);
    expect(summarizeImportFilterDecisions(decisions)).toEqual({
      included: 2,
      excluded: 2,
      needsReview: 0,
      reasons: {
        sent_by_user: 1,
        replied_contact: 1,
        no_prior_engagement: 1,
        promotional_or_bulk: 1,
      },
    });
  });

  it("can switch to the everything profile without losing source records", () => {
    const message = email({
      id: "<promo-1@example.com>",
      from: "offers@example.com",
      to: ["peter@example.com"],
      subject: "50% off boiler parts",
      headers: {
        "List-Unsubscribe": "<https://example.com/unsubscribe>",
      },
    });

    expect(
      evaluateEmailImportProfile({
        profile: "everything",
        message,
        engagement: buildEmailEngagementIndex([message], myAddresses),
        myAddresses,
      }),
    ).toEqual({
      action: "include",
      reason: "profile_everything",
      confidence: 1,
    });
  });

  it("keeps normal email in the clean default profile", () => {
    const message = email({
      id: "<normal-1@example.com>",
      from: "stranger@example.com",
      to: ["peter@example.com"],
      subject: "Hello",
    });

    expect(
      evaluateEmailImportProfile({
        profile: "clean_default",
        message,
        engagement: buildEmailEngagementIndex([message], myAddresses),
        myAddresses,
      }),
    ).toEqual({
      action: "include",
      reason: "not_promotional_or_bulk",
      confidence: 0.85,
    });
  });
});
