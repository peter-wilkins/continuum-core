# Source Catalogue

ChatGPT and broad private-history imports are postponed for the MVP path.

The MVP source strategy is now public-first and identity-first: choose a target identity or topic, gather public source records, then let users explore the resulting Continuum and give feedback. The existing catalogue below still records parser pressure-test coverage, but the next active imports should prefer public, licensed, inspectable data.

Example import scopes:

- `identity=Ada Lovelace`
- `identity=Ada Lovelace topic=computing`
- `identity=Charles Babbage topic=Analytical Engine`

Public-first source queue:

| Rank | Source | Why it matters |
| --- | --- | --- |
| 1 | Wikidata identity/entity records | Stable identity ids, aliases, dates, relationships, and source links. |
| 2 | Wikipedia/MediaWiki revisions and page metadata | Public narrative plus revision history for how shared understanding changed. |
| 3 | Wikisource/public-domain texts and letters | Primary public writings where available. |
| 4 | Project Gutenberg / Internet Archive public texts | Public-domain books and scans for historical thought corpora. Implemented first as an explicit public-document source record. |
| 5 | GitHub public issues, pull requests, reviews, discussions | Modern extended thought around software projects. |
| 6 | Crossref/OpenAlex-style publication metadata | Public scholarly graph pressure without importing private material. |

| Rank | Source | Status | Personal value | Schema stress | Privacy risk | Next event target | Example data |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Claude export | implemented fixture | high | medium | high | Claude chat message | `src/fixtures/claude-one-conversation.json` |
| 2 | Email / MBOX | implemented fixture | high | high | high | RFC 5322 email message | `src/fixtures/email-one-message.mbox` |
| 3 | Git commits | implemented fixture | high | high | medium | Git commit | `src/fixtures/git-one-commit.txt` |
| 4 | GitHub issues, pull requests, reviews, commits, discussions | implemented fixture | high | high | medium | GitHub issue comment | `src/fixtures/github-one-issue-comment.json` |
| 5 | Wikimedia / Wikipedia / Wikidata | implemented fixture | low | high | low | Wikidata entity snapshot | `src/fixtures/wikidata-ada-lovelace-entity.json` |
| 6 | Calendar / iCalendar | implemented fixture | high | medium | high | Calendar event | `src/fixtures/calendar-one-event.ics` |
| 7 | Slack export | implemented fixture | high | high | high | Slack channel message | `src/fixtures/slack-one-channel-message.json` |
| 8 | Markdown / Obsidian / local docs | implemented fixture | high | medium | medium | Markdown file revision snapshot | `src/fixtures/markdown-one-note.md` |
| 9 | Google Chrome history | implemented fixture | high | medium | high | Chrome browser history visit | `src/fixtures/google-chrome-history-one-record.json` |
| 10 | Google Chrome bookmarks | implemented fixture | high | medium | high | Chrome bookmark snapshot | `src/fixtures/google-chrome-bookmarks-one-record.html` |
| 11 | Google Chrome reading list | implemented fixture | high | medium | high | Chrome reading list entry | `src/fixtures/google-chrome-reading-list-one-record.html` |
| 12 | Google My Activity / Search / Gemini | implemented fixture | high | high | high | Google activity record | `src/fixtures/google-my-activity-three-records.json` |
| 13 | YouTube history | implemented fixture | high | medium | high | YouTube watch/search activity | `src/fixtures/google-my-activity-three-records.json` |
| 14 | Google Contacts | implemented fixture | high | high | high | Contact identity snapshot | `src/fixtures/google-contacts-one-record.vcf` |
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

GitHub pull-request metadata can point at Git commits through head/base/merge SHAs. Preserve those SHAs as references, but do not count the PR metadata as independent Git commit evidence.

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
- Contacts: identity graph snapshots imported from vCard; these are identity evidence, not activity evidence.
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
- Wikidata data access: https://www.wikidata.org/wiki/Wikidata:Data_access
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
