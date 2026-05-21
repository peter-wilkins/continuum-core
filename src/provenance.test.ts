import { describe, expect, it } from "vitest";

import {
  countIndependentEvidence,
  normalizeEmailMessage,
  normalizeMediaWikiRevision,
} from "./index";

describe("provenance-aware ingestion", () => {
  it("adds required provenance to imported email events", () => {
    const event = normalizeEmailMessage({
      mailbox: {
        path: "mail/export.mbox",
      },
      message: {
        messageId: "<msg-1@example.com>",
        date: "Thu, 21 May 2026 10:42:03 +0000",
        from: { name: "Peter", address: "peter@example.com" },
        to: [{ name: "Bob", address: "bob@example.com" }],
        cc: [],
        bcc: [],
        replyTo: [],
        subject: "Boiler quote",
        textBody: "Need to quote Bob for the boiler.",
        inReplyTo: [],
        references: [],
        attachmentCount: 0,
      },
    });

    expect(event.provenance).toEqual({
      sourceFamily: "personal_communications",
      sourceName: "email_mbox",
      upstreamSources: [],
      derivedFrom: [],
      retrievedAt: "unknown",
      license: null,
    });
  });

  it("does not count same-lineage Wikimedia evidence as independent", () => {
    const wikipediaRevision = normalizeMediaWikiRevision({
      project: "en.wikipedia.org",
      page: {
        pageid: 175722,
        ns: 0,
        title: "Boiler",
      },
      revision: {
        revid: 1344875211,
        parentid: 1340805738,
        timestamp: "2026-03-23T01:42:24Z",
        user: "Tim1965",
        userid: 405840,
        comment: "added dutch oven, with cite",
        sha1: "7668dedccf109a2dfabd5e931261cd8aaeeeb237",
        size: 30610,
        slots: {
          main: {
            contentmodel: "wikitext",
            contentformat: "text/x-wiki",
            contentSha1: "7668dedccf109a2dfabd5e931261cd8aaeeeb237",
          },
        },
      },
    });
    const derivedDbpediaEvent = {
      ...wikipediaRevision,
      id: "dbpedia:resource:Boiler",
      provenance: {
        sourceFamily: "public_knowledge_graph",
        sourceName: "dbpedia",
        upstreamSources: ["wikipedia"],
        derivedFrom: ["wikipedia"],
        retrievedAt: "2026-05-21T12:00:00.000Z",
        license: "CC-BY-SA",
      },
    };

    expect(countIndependentEvidence([wikipediaRevision, derivedDbpediaEvent])).toBe(
      1,
    );
  });
});
