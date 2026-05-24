# 089 - Add Secret Spill Membrane

## Status

Open

## Context

During local dogfooding, a Supabase personal access token was pasted into an agent chat. The immediate local Codex history and logs were redacted, but this should be a product behaviour rather than a manual cleanup.

Secrets are a special membrane case. They should normally never become source truth. If they do, the system should quarantine or redact them quickly, keep a decision trail, and guide the user toward a safer handoff such as a private env file.

The system must assume users will sometimes paste secrets into chat, speech, notes, feedback, or import material. That is normal human behaviour under friction. The membrane should make the store robust against those spills instead of relying on perfect user discipline.

## Vertical Slice

Implement a first secret-spill membrane for text capture paths and Continuum Store writes.

## Acceptance Criteria

- [ ] Secret-looking text is classified as `secret` before becoming memory-active.
- [ ] Secret-looking text pasted by a user is handled as an expected spill, not an exceptional crash path.
- [ ] Continuum Store writes pass through a redaction/quarantine step before readable text is persisted.
- [ ] Secret-looking text is not shown in generated lens outputs, previews, logs, or agent coordination messages.
- [ ] The membrane records a redaction decision without retaining the readable secret in durable source truth.
- [ ] The user-facing recovery path says to rotate the credential if it crossed chat, GitHub, docs, or another shared boundary.
- [ ] Developer docs describe the safe credential handoff: create a local `0600` env file, then ask the user to write the secret there.

## Notes

- Do not build a full DLP system in the first slice.
- Start with obvious token patterns and explicit user-marked secrets.
- A permissive local membrane may allow short retention for dogfooding only when retention is explicit.
- Safer credential handoff remains an env file, but the product still needs robust redaction because users will paste secrets anyway.
