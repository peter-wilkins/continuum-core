# 083: Fetch Bootstrap Public Sources

Status: done

## Type

AFK.

## Context

The bootstrap MVP should import a public Continuum about extended thought and brain augmentation. The first source pack should be reproducible and public, not hand-curated loose web snippets.

## What Was Built

Added a local fetch script that creates explicit public-document records from Wikipedia pages under gitignored `data/bootstrap-public-sources`.

## First failing test

Manual source fetch and CLI import smoke.

## Acceptance Criteria

- [x] Fetch public source records for extended thought / brain augmentation topics.
- [x] Write records as explicit `public-document` JSON files.
- [x] Preserve source URL, revision id, retrieved time, and licence text.
- [x] Keep fetched data out of git.
- [x] Run import CLI over fetched records.

## Source Pages

- Extended mind thesis
- Distributed cognition
- Intelligence amplification
- Augmented cognition
- Brain-computer interface
- Neurotechnology

## Notes

Wikipedia records use `sourceFamily=wikimedia`, `sourceName=wikipedia`, and `platform=wikimedia`.

Scope evaluation may need a future pass: focus-only pages like brain-computer interface may be valuable for the bootstrap continuum even when they do not explicitly mention the primary phrase `extended thought`.
