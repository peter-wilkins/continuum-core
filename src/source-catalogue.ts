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
  provenance: {
    sourceFamily: string;
    sourceName: string;
    upstreamSources: string[];
    derivedFrom: string[];
    overlapWarning: string;
  };
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
    provenance: {
      sourceFamily: "ai_chat_export",
      sourceName: "claude",
      upstreamSources: [],
      derivedFrom: [],
      overlapWarning: "Independent user export; do not treat copied/pasted source material inside chats as independent evidence.",
    },
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
    provenance: {
      sourceFamily: "personal_communications",
      sourceName: "email_mbox",
      upstreamSources: [],
      derivedFrom: [],
      overlapWarning: "Email forwards and quoted replies can duplicate upstream content; preserve headers before weighting.",
    },
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
    provenance: {
      sourceFamily: "software_development",
      sourceName: "git",
      upstreamSources: [],
      derivedFrom: [],
      overlapWarning: "GitHub mirrors Git commits; count commit evidence once per repository lineage.",
    },
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
    provenance: {
      sourceFamily: "software_development",
      sourceName: "github",
      upstreamSources: ["git"],
      derivedFrom: [],
      overlapWarning: "GitHub commits can duplicate Git data; issues/PR comments are separate collaboration records.",
    },
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
    provenance: {
      sourceFamily: "public_knowledge_graph",
      sourceName: "wikimedia",
      upstreamSources: ["wikipedia", "wikidata"],
      derivedFrom: ["wikipedia"],
      overlapWarning: "Wikipedia, Wikidata, DBpedia, and many downstream knowledge graphs share lineage; do not count as independent by default.",
    },
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
    provenance: {
      sourceFamily: "personal_schedule",
      sourceName: "icalendar",
      upstreamSources: [],
      derivedFrom: [],
      overlapWarning: "Calendar invites may duplicate email messages; use UID and organizer/attendee lineage.",
    },
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
    provenance: {
      sourceFamily: "team_communications",
      sourceName: "slack",
      upstreamSources: [],
      derivedFrom: [],
      overlapWarning: "Slack imports, cross-posts, and GitHub app messages may duplicate other sources.",
    },
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
    provenance: {
      sourceFamily: "local_documents",
      sourceName: "markdown",
      upstreamSources: [],
      derivedFrom: [],
      overlapWarning: "Docs may be generated from chats, issues, or code; record generator lineage when known.",
    },
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
    provenance: {
      sourceFamily: "activity_log",
      sourceName: "google_takeout",
      upstreamSources: [],
      derivedFrom: [],
      overlapWarning: "Activity records may be pointers to web/email/calendar artifacts already imported elsewhere.",
    },
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
    provenance: {
      sourceFamily: "workspace_documents",
      sourceName: "notion",
      upstreamSources: [],
      derivedFrom: [],
      overlapWarning: "Notion pages may embed synced docs, GitHub issues, or pasted chat outputs.",
    },
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
    provenance: {
      sourceFamily: "ai_chat_export",
      sourceName: "chatgpt",
      upstreamSources: [],
      derivedFrom: [],
      overlapWarning: "Independent user export; pasted source material inside chats needs its own lineage.",
    },
  },
] as const satisfies SourceCatalogueEntry[];
