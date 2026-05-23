# 084: Add Public Scope Membership Policy

Status: done

## Type

TDD.

## Context

The bootstrap public corpus fetch showed a scope-shape problem.

Strict identity-first evaluation works for `Ada Lovelace through computing`: a computing-only source should not automatically belong to Ada Lovelace.

The bootstrap scope is different. `extended thought through brain augmentation` is a broad concept exploration. Useful focus-side sources such as `Brain-computer interface` and `Neurotechnology` should not become active without evidence, but they also should not be treated as clean rejects.

## What To Build

Add an explicit required membership policy to `ImportScope`.

## First Failing Test

`keeps focus identity matches in review when exploratory scope membership allows focus candidates`

## Acceptance Criteria

- [x] `ImportScope` requires a membership policy.
- [x] Existing Ada-style scopes can require primary identity matches.
- [x] Bootstrap concept scopes can keep focus-only matches in `needs_review`.
- [x] Focus-only review decisions expose matched focus terms.
- [x] Source-family rejects still happen before membership matching.
- [x] Dry-run previews count the new decision reason.

## Out Of Scope

- LLM classification.
- Embedding similarity.
- Auto-activating focus-only sources.
- User-facing curation UI.

## Verification

Real bootstrap Wikipedia dry-run now gives:

- `include`: Augmented cognition, Distributed cognition, Intelligence amplification
- `needs_review`: Brain-computer interface, Extended mind thesis, Neurotechnology
- `exclude`: none
