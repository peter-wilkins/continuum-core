import githubIssueCommentFixture from "./fixtures/github-one-issue-comment.json" with {
  type: "json",
};
import githubIssueFixture from "./fixtures/github-one-issue.json" with {
  type: "json",
};
import { describe, expect, it } from "vitest";

import {
  normalizeGitHubIssue,
  normalizeGitHubIssueComment,
  parseGitHubIssue,
  parseGitHubIssueComment,
  type GitHubIssueNormalizationInput,
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

  it("imports one GitHub issue into the canonical event model", () => {
    const parsed = parseGitHubIssue(githubIssueFixture);

    if (!parsed.ok) {
      throw new Error("Fixture should parse.");
    }

    const event = normalizeGitHubIssue({
      issue: parsed.value,
    } as GitHubIssueNormalizationInput);

    expect(event).toMatchObject({
      id: "github_issue:octocat/Hello-World#9578:4493366828:PR_kwDOABPHjc7d33VA",
      source: {
        platform: "github",
        key: "github_issue:octocat/Hello-World#9578:4493366828:PR_kwDOABPHjc7d33VA",
        externalConversationId: "octocat/Hello-World#9578",
        externalMessageId: "4493366828:PR_kwDOABPHjc7d33VA",
        artifactId: "https://github.com/octocat/Hello-World/pull/9578",
        externalParentId: null,
        canonicalParentEventId: null,
      },
      provenance: {
        sourceFamily: "software_development",
        sourceName: "github",
        upstreamSources: [],
        derivedFrom: [],
        retrievedAt: "2026-05-21T09:26:33.000Z",
        license: null,
      },
      time: {
        createdAt: "2026-05-21T09:26:33.000Z",
        createdAtConfidence: "exact",
      },
      actor: {
        role: "user",
      },
      participants: [
        {
          role: "author",
          name: "a3236852",
          address: "https://github.com/a3236852",
        },
      ],
      content: {
        kind: "text",
        subject: "octocat/Hello-World#9578 pull request",
        text: [
          "add abc.txt",
          "123",
          "Repository: octocat/Hello-World",
          "Number: 9578",
          "State: closed",
          "Kind: pull_request",
          "Pull Request: https://github.com/octocat/Hello-World/pull/9578",
          "Author: a3236852",
          "Association: NONE",
          "Comments: 0",
          "Closed: 2026-05-21T09:30:27.000Z",
        ].join("\n"),
      },
    });
    expect(event.source.fingerprint).toMatch(/^[0-9a-f]{16}$/);
  });
});
