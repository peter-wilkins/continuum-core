# 089 - Add Secret Spill Membrane

## Status

In Progress

## Context

During local dogfooding, a Supabase personal access token was pasted into an agent chat. The immediate local Codex history and logs were redacted, but this should be a product behaviour rather than a manual cleanup.

Secrets are a special membrane case. They should normally never become source truth. If they do, the system should quarantine or redact them quickly, keep a decision trail, and guide the user toward a safer handoff such as a private env file.

The system must assume users will sometimes paste secrets into chat, speech, notes, feedback, or import material. That is normal human behaviour under friction. The membrane should make the store robust against those spills instead of relying on perfect user discipline.

Supabase personal access tokens are especially risky in this workflow. The Supabase MCP `read_only=true` option constrains what the MCP server does, but it does not make the underlying PAT a read-only secret if the token is copied elsewhere. Treat any pasted PAT as compromised and rotate it.

## Vertical Slice

Implement a first secret-spill membrane for text capture paths and Continuum Store writes.

## Progress

- [x] Added a core secret-spill membrane function for text payloads.
- [x] Redacts obvious Supabase PATs, OpenAI-style API keys, and private-key blocks.
- [x] Returns redacted text, `secret` classification, and secret-free findings with fingerprints.
- [x] Added focused tests for pasted Supabase PATs and ordinary human text.
- [x] Confirmed the first slice with typecheck and the full test suite.

## Acceptance Criteria

- [x] Secret-looking text is classified as `secret` before becoming memory-active.
- [x] Secret-looking text pasted by a user is handled as an expected spill, not an exceptional crash path.
- [x] Continuum Store writes pass through a redaction/quarantine step before readable text is persisted.
- [x] Secret-looking text is not shown in generated lens outputs, previews, logs, or agent coordination messages.
- [x] The membrane records a redaction decision without retaining the readable secret in durable source truth.
- [x] The user-facing recovery path says to rotate the credential if it crossed chat, GitHub, docs, or another shared boundary.
- [x] Developer docs describe the safe credential handoff: create a local `0600` env file, then ask the user to write the secret there.
- [x] Docs distinguish token power from wrapper policy: a read-only MCP URL is useful, but a leaked full-power PAT is still a leaked full-power PAT.

## Notes

- Do not build a full DLP system in the first slice.
- Start with obvious token patterns and explicit user-marked secrets.
- A permissive local membrane may allow short retention for dogfooding only when retention is explicit.
- Safer credential handoff remains an env file, but the product still needs robust redaction because users will paste secrets anyway.
