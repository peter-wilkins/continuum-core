# 058: Keep Needs Review Imports Inactive

Status: ready

## Type

AFK.

## What to build

Implement the first thin curation membrane for imports: records marked `needs_review` stay local and inspectable, but do not become memory-active material.

This is deliberately not an interactive curator. It is a conservative gate between broad local import and memory/retrieval. If the importer is uncertain, the record should be retained for preview/review rather than promoted.

## First failing test

`keeps needs-review import records local but inactive for retrieval`

## Acceptance Criteria

- [ ] Import profile decisions can represent `include`, `exclude`, and `needs_review` in preview/report output.
- [ ] `needs_review` records remain inspectable locally with reason and confidence.
- [ ] `needs_review` records are not converted into retrieval-active Imported Entries or Continuation Candidates.
- [ ] `include` records still flow through the existing imported-entry and retrieval path.
- [ ] `exclude` records do not become retrieval-active and are counted separately from `needs_review`.
- [ ] Conservative default is documented or tested: uncertainty routes to `needs_review`, not `include`.

## Blocked by

None - can start immediately.

## Notes

Resolved domain decision:

- Avoid `Curated Entry` as a domain term. Curation is membrane-relative; all Entries are curated to some extent.
- Use behavior/state language instead: `memory-active`, `promoted`, `needs_review`, `include`, `exclude`.
- Do not build a learning or conversational curator in this slice.

Relevant docs:

- `docs/ingestion-membranes-two-agent-model.md`
- `docs/specs/import-munging-tool.md`
