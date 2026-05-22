# 060: Wire Email MBOX Engagement Profile Into CLI

Status: ready

## Type

AFK.

## Context

We have enough real email data to pause email import work and pivot.

Current direct MBOX state:

- `email-mbox` CLI source exists.
- One committed MBOX fixture imports and dry-runs through the CLI.
- Malformed MBOX messages quarantine instead of crashing.
- Direct `inspect email-mbox` uses a streaming header-only pass, so it can handle multi-GB mailboxes without loading the whole file.
- Direct full dry-run/import still parses messages into memory, so it should only be used on small slices until sampling/limits exist.

Real local mailbox evidence:

- Source: `/home/peter/continuum/data/import-samples/All mail Including Spam and Trash-002.mbox`
- Size: about 7.8GB.
- Streaming inspect result:
  - records seen: 89,666
  - importable: 89,637
  - quarantined: 29
  - warnings: 0
  - elapsed: 1:47.77
  - max RSS: about 205MB
- First-100 private slice:
  - dry-run: 100 new, 0 quarantined, 100 needs review
  - import: first run 100 new
  - reimport: 0 new, 100 known

The surprising bit is the first-100 dry-run result: all email records became `needs_review`.

That is expected with the current wiring. The generic canonical-event profile is being used for `email-mbox` dry-run, not the email-specific engagement profile.

## What To Build

Wire direct `email-mbox` dry-run/import profile decisions through the existing email engagement logic.

The core logic already exists:

- `buildEmailEngagementIndex(messages, myAddresses)` performs the first pass.
- `evaluateEmailImportProfile(...)` applies `everything`, `clean_default`, and `intentional_context` email decisions.
- It can include sent-by-user, replied-contact, and participated-thread email while excluding promotional/bulk and unreplied one-way senders.

The CLI path does not yet use this logic for MBOX.

## First Failing Test

`dry-runs MBOX email with engaged-contact decisions`

## Acceptance Criteria

- [ ] `email-mbox` dry-run performs an email-specific first pass over parsed messages before creating preview decisions.
- [ ] The first pass builds an engagement index from explicit `myAddresses`.
- [ ] `intentional_context` includes messages sent by the user.
- [ ] `intentional_context` includes messages from replied contacts.
- [ ] `intentional_context` includes messages in threads the user participated in.
- [ ] Promotional/bulk email remains excluded before engagement checks.
- [ ] Unreplied one-way email is excluded or routed to review according to the documented profile decision.
- [ ] The preview still keeps raw imported events inspectable and does not make excluded/needs-review records memory-active.
- [ ] The interface does not guess Peter's email addresses from data. `myAddresses` must be explicit.

## Out Of Scope

- Full 7.8GB dry-run preview generation.
- Loading a full mailbox into memory.
- Folder/zip `.mbox` routing.
- Gmail label-specific filtering.
- Quote stripping.
- Attachment extraction.
- Curator UI.

## Follow-On Issues

- Add `--limit` or sampled preview mode for huge MBOX dry-runs.
- Add a streaming full-import path for MBOX if we want to import all 89k messages.
- Add folder/zip `.mbox` routing through the streaming path, not the archive whole-file reader.
- Add progress output for long-running imports.
