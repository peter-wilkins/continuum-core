# Privacy Membranes

A membrane is a policy boundary controlling what data can cross from one context to another.

Continuum has two different privacy zones:

- Inner core: broad local capture and immutable event history.
- Outer world: prompts, exports, sync, logs, docs, PRs, people, and other systems.

The inner core may ingest everything. The outer membrane must decide what is allowed to leave.

## First Model

Protected payloads carry:

- `id`
- `classification`: `public`, `internal`, `private`, or `secret`
- encrypted payload bytes
- key material
- erasure status

Erasure:

- keeps the immutable tombstone
- removes key material
- makes payload read return `erased`
- blocks disclosure/export
- records a membrane decision

This gives append-only history without making personal data readable forever.

## GDPR Shape

GDPR risk starts at storage and processing, not only at external disclosure. For personal/local use there may be domestic-purpose exemptions, but shared/product/server use needs deletion, retention, and security plans from the start.

Design rule:

> Immutable means changes are represented as later events. It does not mean payloads are recoverable forever.

## Later Work

- Store key material outside event records.
- Purge derived search indexes, embeddings, caches, and previews on erasure.
- Replay erasure ledger after backup restore.
- Add classification at import time.
- Add prompt-specific disclosure policies.
- Add export/share policies for docs, GitHub, and public web.

## Sources

- ICO storage limitation: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/storage-limitation/
- ICO right to erasure: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-erasure/
- EDPB Article 17: https://www.edpb.europa.eu/gdpr-articles/article-17-right-erasure-right-be-forgotten_nl
- ICO domestic purposes exemption: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/exemptions/a-guide-to-the-data-protection-exemptions/
