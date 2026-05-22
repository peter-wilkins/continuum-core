import githubIssueCommentFixture from "./fixtures/github-one-issue-comment.json" with {
  type: "json",
};
import { describe, expect, it } from "vitest";

import {
  normalizeGitHubIssueComment,
  parseGitHubIssueComment,
  type GitHubIssueCommentNormalizationInput,
} from "./index";

describe("GitHub import", () => {
  it("imports one GitHub issue comment into the canonical event model", () => {
    const parsed = parseGitHubIssueComment(githubIssueCommentFixture);

    if (!parsed.ok) {
      throw new Error("Fixture should parse.");
    }

    const event = normalizeGitHubIssueComment({
      comment: parsed.value,
    } as GitHubIssueCommentNormalizationInput);

    expect(event).toMatchObject({
      id: "github_issue_comment:octocat/Hello-World#2:1146825:MDEyOklzc3VlQ29tbWVudDExNDY4MjU=",
      source: {
        platform: "github",
        key: "github_issue_comment:octocat/Hello-World#2:1146825:MDEyOklzc3VlQ29tbWVudDExNDY4MjU=",
        externalConversationId: "octocat/Hello-World#2",
        externalMessageId: "1146825:MDEyOklzc3VlQ29tbWVudDExNDY4MjU=",
        artifactId: "https://github.com/octocat/Hello-World/pull/2#issuecomment-1146825",
        externalParentId: null,
        canonicalParentEventId: null,
      },
      provenance: {
        sourceFamily: "software_development",
        sourceName: "github",
        upstreamSources: [],
        derivedFrom: [],
        retrievedAt: "2011-05-12T14:34:22.000Z",
        license: null,
      },
      time: {
        createdAt: "2011-05-12T14:34:22.000Z",
        createdAtConfidence: "exact",
      },
      actor: {
        role: "user",
      },
      participants: [
        {
          role: "author",
          name: "mattstifanelli",
          address: "https://github.com/mattstifanelli",
        },
      ],
      content: {
        kind: "text",
        subject: "octocat/Hello-World#2 issue comment",
        text: [
          "Let's try again via Issue tacker...",
          "Issue: octocat/Hello-World#2",
          "Comment: https://github.com/octocat/Hello-World/pull/2#issuecomment-1146825",
          "Author: mattstifanelli",
          "Association: NONE",
        ].join("\n"),
      },
    });
    expect(event.source.fingerprint).toMatch(/^[0-9a-f]{16}$/);
  });
});
