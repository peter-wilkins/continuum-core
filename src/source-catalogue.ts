export type SourceCatalogueStatus =
  | "implemented_fixture"
  | "sample_available"
  | "needs_user_export"
  | "postponed";

export type SourceCatalogueEntry = {
  rank: number;
  id: string;
  name: string;
  status: SourceCatalogueStatus;
  personalContinuityValue: "high" | "medium" | "low";
  schemaStressValue: "high" | "medium" | "low";
  privacyRisk: "high" | "medium" | "low";
  nextEventTarget: string;
  exampleDataPath: string | null;
  officialDocs: string[];
};

export const sourceCatalogue = [
  {
    rank: 1,
    id: "claude-export",
    name: "Claude export",
    status: "implemented_fixture",
    personalContinuityValue: "high",
    schemaStressValue: "medium",
    privacyRisk: "high",
    nextEventTarget: "Claude chat message",
    exampleDataPath: "src/fixtures/claude-one-conversation.json",
    officialDocs: [
      "https://platform.claude.com/docs/en/manage-claude/compliance-content-data",
      "https://platform.claude.com/docs/en/api/compliance/apps/chats/messages",
    ],
  },
  {
    rank: 2,
    id: "email-mbox",
    name: "Email / MBOX",
    status: "implemented_fixture",
    personalContinuityValue: "high",
    schemaStressValue: "high",
    privacyRisk: "high",
    nextEventTarget: "RFC 5322 email message",
    exampleDataPath: "data/email/rfc-style-example.mbox",
    officialDocs: [
      "https://www.rfc-editor.org/rfc/rfc4155",
      "https://www.rfc-editor.org/rfc/rfc5322",
    ],
  },
  {
    rank: 3,
    id: "git-commits",
    name: "Git commits",
    status: "sample_available",
    personalContinuityValue: "high",
    schemaStressValue: "high",
    privacyRisk: "medium",
    nextEventTarget: "Git commit",
    exampleDataPath: "data/git/continuum-core-log.txt",
    officialDocs: [
      "https://git-scm.com/docs/pretty-formats",
      "https://git-scm.com/docs/user-manual",
    ],
  },
  {
    rank: 4,
    id: "github-collaboration",
    name: "GitHub issues, pull requests, reviews, commits, discussions",
    status: "sample_available",
    personalContinuityValue: "high",
    schemaStressValue: "high",
    privacyRisk: "medium",
    nextEventTarget: "GitHub issue comment",
    exampleDataPath: "data/github/octocat-hello-world-issue-comments.json",
    officialDocs: [
      "https://docs.github.com/en/rest/issues/comments",
      "https://docs.github.com/en/rest/pulls/pulls",
    ],
  },
  {
    rank: 5,
    id: "wikimedia-family",
    name: "Wikimedia / Wikipedia / Wikidata",
    status: "implemented_fixture",
    personalContinuityValue: "low",
    schemaStressValue: "high",
    privacyRisk: "low",
    nextEventTarget: "MediaWiki page revision",
    exampleDataPath: "data/wikimedia/boiler-revisions.json",
    officialDocs: [
      "https://www.mediawiki.org/wiki/API:Revisions",
      "https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/reference/page-views.html",
    ],
  },
  {
    rank: 6,
    id: "calendar-icalendar",
    name: "Calendar / iCalendar",
    status: "sample_available",
    personalContinuityValue: "high",
    schemaStressValue: "medium",
    privacyRisk: "high",
    nextEventTarget: "Calendar event",
    exampleDataPath: "data/calendar/basic-event.ics",
    officialDocs: ["https://www.rfc-editor.org/rfc/rfc5545"],
  },
  {
    rank: 7,
    id: "slack-export",
    name: "Slack export",
    status: "needs_user_export",
    personalContinuityValue: "high",
    schemaStressValue: "high",
    privacyRisk: "high",
    nextEventTarget: "Slack channel message",
    exampleDataPath: null,
    officialDocs: [
      "https://slack.com/help/articles/220556107-How-to-read-Slack-data-exports",
    ],
  },
  {
    rank: 8,
    id: "markdown-local-docs",
    name: "Markdown / Obsidian / local docs",
    status: "sample_available",
    personalContinuityValue: "high",
    schemaStressValue: "medium",
    privacyRisk: "medium",
    nextEventTarget: "Markdown file revision snapshot",
    exampleDataPath: "README.md",
    officialDocs: ["https://spec.commonmark.org/"],
  },
  {
    rank: 9,
    id: "google-my-activity",
    name: "Google My Activity / Gemini / Takeout",
    status: "needs_user_export",
    personalContinuityValue: "high",
    schemaStressValue: "high",
    privacyRisk: "high",
    nextEventTarget: "Google activity record",
    exampleDataPath: null,
    officialDocs: [
      "https://developers.google.com/data-portability/schema-reference/my_activity",
      "https://support.google.com/accounts/answer/3024190",
    ],
  },
  {
    rank: 10,
    id: "notion-export",
    name: "Notion export / API pages",
    status: "needs_user_export",
    personalContinuityValue: "medium",
    schemaStressValue: "high",
    privacyRisk: "high",
    nextEventTarget: "Notion markdown page",
    exampleDataPath: null,
    officialDocs: ["https://www.notion.com/help/export-your-content"],
  },
] as const satisfies SourceCatalogueEntry[];

export const postponedSourceCatalogue = [
  {
    rank: 11,
    id: "chatgpt-export",
    name: "ChatGPT export",
    status: "postponed",
    personalContinuityValue: "high",
    schemaStressValue: "medium",
    privacyRisk: "high",
    nextEventTarget: "ChatGPT conversation message",
    exampleDataPath: "src/fixtures/chatgpt-one-conversation.json",
    officialDocs: ["https://help.openai.com/en/articles/7260999-how-do-i-export-my-chatgpt-history-and-data"],
  },
] as const satisfies SourceCatalogueEntry[];
