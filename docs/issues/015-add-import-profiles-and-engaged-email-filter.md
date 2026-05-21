# 015: Add Import Profiles And Engaged Email Filter

## Type

AFK.

## What to build

Define source-agnostic import profiles, then implement the first email-specific profile: import emails involving contacts Peter replied to.

## Acceptance Criteria

- [x] Define `ImportProfile`.
- [x] Define `ImportFilterDecision`.
- [x] Add email engagement scan pass.
- [x] `everything` profile includes all valid records.
- [x] `clean_default` profile excludes obvious junk but keeps ordinary records.
- [x] `engaged_contacts` includes sent-by-user records.
- [x] `engaged_contacts` includes senders Peter replied to.
- [x] `engaged_contacts` excludes unreplied one-way senders.
- [x] Promotional/bulk email is excluded before engagement checks.
- [x] Filter summary reports included/excluded counts by reason.

## Notes

This is not Gmail-specific. Gmail labels may become extra signals later, but the core profile is based on generic email shape:

- sender
- recipients
- reply headers
- thread references
- bulk/list headers

Raw source data can be reprocessed with another profile later.
