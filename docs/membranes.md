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

## Secret Spills

Secrets should not enter chat, docs, GitHub, import fixtures, logs, or mailbox messages. When a tool needs a credential, the preferred handoff is a private local env file with `0600` permissions.

Safe credential handoff:

1. The agent creates the env file path and permissions, for example:

   ```bash
   install -d -m 700 "$HOME/.config/continuum"
   touch "$HOME/.config/continuum/supabase-mcp.env"
   chmod 600 "$HOME/.config/continuum/supabase-mcp.env"
   ```

2. The human writes the secret into that file locally.
3. The agent reads only whether the expected environment variable is present, not the value.
4. The agent tests the integration without printing the credential.

Wrapper policy is not credential power. For example, a Supabase MCP URL with `read_only=true` is useful because it constrains that MCP session. It does not make the underlying personal access token read-only if the raw token leaks somewhere else. Treat a leaked full-power token as a leaked full-power token and rotate it.

If a secret does cross a membrane by mistake:

- mark the captured item as `secret`
- redact copies in local logs, history, previews, and generated summaries
- keep only a tombstone and membrane decision in durable history
- rotate the credential if it crossed any external or shared boundary

Permissive membranes may temporarily allow sensitive material for local dogfooding, but retention must be explicit and short. A secret that is only needed for an agent task should live in an env file, not in Continuum source truth.

## Later Work

- Store key material outside event records.
- Purge derived search indexes, embeddings, Local Source Cache rows, caches, and previews on erasure.
- Replay erasure ledger after backup restore.
- Add classification at import time.
- Add automatic secret-spill detection for capture inlets, chat imports, logs, and agent coordination messages.
- Add prompt-specific disclosure policies.
- Add export/share policies for docs, GitHub, and public web.

## Sources

- ICO storage limitation: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/storage-limitation/
- ICO right to erasure: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-erasure/
- EDPB Article 17: https://www.edpb.europa.eu/gdpr-articles/article-17-right-erasure-right-be-forgotten_nl
- ICO domestic purposes exemption: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/exemptions/a-guide-to-the-data-protection-exemptions/
