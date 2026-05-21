# 009: Pressure Test Model With Wikimedia

## Type

HITL.

## Blocked by

- [003: Normalize One ChatGPT User Message](003-normalize-one-chatgpt-user-message.md)

## What to build

Use Wikimedia/Wikipedia/Wikidata to stress the model at large public-knowledge scale.

Wikimedia should be treated as a source family: MediaWiki page revisions, page metadata, links/categories, Wikidata entities/claims, and analytics/pageviews are different record types.

## First failing test

One MediaWiki page revision normalizes into canonical event shape with actor, timestamp, artifact/page reference, revision id, comment, content reference, and provenance.

## Acceptance Criteria

- [x] Wikimedia source family is split into concrete schema targets.
- [x] Page revision maps as an event without forcing conversation/message terminology.
- [x] Wikidata entity/claim model pressure is noted separately from page revision pressure.
- [x] Pageview analytics are identified as aggregate events, not content events.
- [x] Scale implications are recorded but not optimized prematurely.

## Evidence

- MediaWiki revisions API exposes page revision fields including revision ids, parent ids, timestamp, user/userid, comment, content metadata, size, sha1, slots, and optional content.
- Wikimedia Analytics Pageviews API exposes page/project view metrics over time. These are aggregate measurements, not content edits.
- Wikidata entity dumps/APIs expose structured entities and claims. A Wikidata claim is closer to graph assertion/change pressure than page text pressure.
- Representative fixture: `src/fixtures/mediawiki-one-revision.json`.

Sources:

- https://www.mediawiki.org/wiki/API:Revisions
- https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/reference/page-views.html
- https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/documentation/getting-started.html

## Source Family Targets

- MediaWiki page revisions: content/artifact change events.
- MediaWiki page metadata: page identity, namespace, title, redirects, protection.
- MediaWiki links/categories: graph edges between artifacts and taxonomies.
- Wikidata entities/claims: structured knowledge graph records and assertion changes.
- Wikimedia pageviews: aggregate traffic measurements by project/page/time bucket.

## Model Pressure

Page revisions are not conversations. They force:

- `source.platform` includes `"wikimedia"`.
- `source.externalMessageId` remains as generic source event/record id; for MediaWiki this is `revid`.
- `source.externalConversationId` becomes generic grouping; for MediaWiki this is the page artifact id.
- `source.artifactId` is required as `string | null`; wiki revisions set it to the page artifact id, chat/email use `null`.
- `source.externalParentId` maps to parent revision id, not chat parent message id.
- `content.subject` can hold page title while `content.text` holds the edit comment for this slice.

Wikidata pressure:

- A claim is an assertion on an entity, not prose content.
- It may need graph primitives: entity id, property id, value, rank, qualifiers, references.
- Do not fold claims into page-revision text events.

Pageview pressure:

- Pageviews are aggregate metric events.
- They need metric name, bucket, project/page dimensions, and count.
- They should not pretend to be content events.

Scale pressure:

- Full Wikimedia data is huge and append-heavy.
- Store source references and fingerprints carefully, but do not optimize dump-scale ingestion before real local fixtures prove the shape.

## TDD Notes

- Red: write one page-revision normalization expectation.
- Green: adjust canonical model only where page revisions force it.
- Refactor: avoid making Wikimedia special; use it to reveal missing primitives.
