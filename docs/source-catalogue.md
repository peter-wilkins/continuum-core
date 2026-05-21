# Source Catalogue

ChatGPT is postponed until the export arrives. Active ranking starts with sources we can inspect now or soon.

| Rank | Source | Status | Personal value | Schema stress | Privacy risk | Next event target | Example data |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Claude export | implemented fixture | high | medium | high | Claude chat message | `src/fixtures/claude-one-conversation.json` |
| 2 | Email / MBOX | implemented fixture | high | high | high | RFC 5322 email message | `data/email/rfc-style-example.mbox` |
| 3 | Git commits | sample available | high | high | medium | Git commit | `data/git/continuum-core-log.txt` |
| 4 | GitHub issues, PRs, reviews, commits, discussions | sample available | high | high | medium | GitHub issue comment | `data/github/octocat-hello-world-issue-comments.json` |
| 5 | Wikimedia / Wikipedia / Wikidata | implemented fixture | low | high | low | MediaWiki page revision | `data/wikimedia/boiler-revisions.json` |
| 6 | Calendar / iCalendar | implemented fixture | high | medium | high | Calendar event | `src/fixtures/calendar-one-event.ics` |
| 7 | Slack export | needs user export | high | high | high | Slack channel message | none yet |
| 8 | Markdown / Obsidian / local docs | implemented fixture | high | medium | medium | Markdown file revision snapshot | `src/fixtures/markdown-one-note.md` |
| 9 | Google Chrome history | implemented fixture | high | medium | high | Chrome browser history visit | `src/fixtures/google-chrome-history-one-record.json` |
| 10 | Google Chrome bookmarks | implemented fixture | high | medium | high | Chrome bookmark snapshot | `src/fixtures/google-chrome-bookmarks-one-record.html` |
| 11 | Google Chrome reading list | implemented fixture | high | medium | high | Chrome reading list entry | `src/fixtures/google-chrome-reading-list-one-record.html` |
| 12 | Google My Activity / Search / Gemini | implemented fixture | high | high | high | Google activity record | `src/fixtures/google-my-activity-three-records.json` |
| 13 | YouTube history | implemented fixture | high | medium | high | YouTube watch/search activity | `src/fixtures/google-my-activity-three-records.json` |
| 14 | Google Contacts | needs user export | high | high | high | Contact identity snapshot | none yet |
| 15 | Google Maps / location activity | implemented fixture | high | high | high | Maps activity or location visit | `src/fixtures/google-my-activity-three-records.json` |
| 16 | Notion export / API pages | needs user export | medium | high | high | Notion markdown page | none yet |

## Provenance Rules

Every source entry carries provenance metadata in `src/source-catalogue.ts`:

- `sourceFamily`: broad evidence family.
- `sourceName`: direct source imported.
- `upstreamSources`: known upstream sources behind the imported record.
- `derivedFrom`: explicit lineage markers.
- `overlapWarning`: why this source might duplicate another source.

Consensus rule:

> Never treat two records as independent unless their upstream lineage differs.

This means content-hash dedupe is not the main tool. Similar evidence can be phrased differently, and exact text can be copied through many channels.

## Postponed

| Rank | Source | Reason |
| --- | --- | --- |
| 17 | ChatGPT export | Peter is waiting on export delivery. Keep fixture coverage, but do not spend the next real-data cycle here. |

## Wikimedia Family

Wikimedia is not one schema:

- MediaWiki page revisions: content/artifact change events.
- MediaWiki page metadata: page identity, namespace, title, redirects, protection.
- MediaWiki links/categories: graph edges.
- Wikidata entities/claims: structured knowledge assertions.
- Pageviews: aggregate metric events.

## Google Takeout Family

Google Takeout is not one schema:

- Chrome history: timestamped attention/activity events pointing at URLs.
- Chrome bookmarks: saved-reference snapshots pointing at URLs.
- Chrome reading list: saved-reference snapshots pointing at URLs.
- My Activity: timestamped product activity across Search, Maps, YouTube, Play, Ads, and related products.
- YouTube history: imported through My Activity watch/search records for now; product-specific uploads, comments, subscriptions, and media metadata are not imported yet.
- Contacts: identity graph snapshots, blocked until the identity model exists.
- Maps/location activity: Maps My Activity is imported; precise location timeline/trips are blocked until stricter location membranes exist.
- Chrome Autofill, extensions, settings, dictionary: blocked until non-event configuration and secrets-adjacent data are classified.

## Evidence Links

- Claude compliance data: https://platform.claude.com/docs/en/manage-claude/compliance-content-data
- Claude chat messages API: https://platform.claude.com/docs/en/api/compliance/apps/chats/messages
- MBOX: https://www.rfc-editor.org/rfc/rfc4155
- Internet Message Format: https://www.rfc-editor.org/rfc/rfc5322
- Git pretty formats: https://git-scm.com/docs/pretty-formats
- GitHub issue comments: https://docs.github.com/en/rest/issues/comments
- GitHub pull requests: https://docs.github.com/en/rest/pulls/pulls
- MediaWiki revisions: https://www.mediawiki.org/wiki/API:Revisions
- Wikimedia pageviews: https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/reference/page-views.html
- iCalendar: https://www.rfc-editor.org/rfc/rfc5545
- Slack exports: https://slack.com/help/articles/220556107-How-to-read-Slack-data-exports
- CommonMark: https://spec.commonmark.org/
- Google My Activity schema: https://developers.google.com/data-portability/schema-reference/my_activity
- Google Chrome schema: https://developers.google.com/data-portability/schema-reference/chrome
- YouTube schema: https://developers.google.com/data-portability/schema-reference/youtube
- Google Maps schema: https://developers.google.com/data-portability/schema-reference/maps
- Google Contacts export: https://support.google.com/contacts/answer/7199294
- Google Takeout: https://support.google.com/accounts/answer/3024190
- Notion export: https://www.notion.com/help/export-your-content
