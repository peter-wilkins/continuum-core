# 077: Fetch Labelled Speech Datasets

Status: done

## Type

AFK.

## Context

Public labelled speech datasets can give Continuum a benchmark corpus for audio processors before private dogfooding audio is safe or plentiful. The first useful path is to fetch direct public archives, record blockers for gated or paid datasets, and provide one tiny harness that can turn audio into inspectable signals.

## What Was Built

Added a dataset fetch script and package command for direct public dataset downloads. Paid, gated, and licence-conflicted datasets are reported as blocked rather than fetched or purchased.

## First failing test

`extracts deterministic acoustic signals from a PCM16 WAV buffer`

## Acceptance Criteria

- [x] Keep raw dataset files under gitignored `data/audio-datasets`.
- [x] Fetch direct public archives without login or payment.
- [x] Skip existing downloaded files on re-run.
- [x] Record blocked datasets with reason and licence status.
- [x] Do not purchase or request licensed access automatically.
- [x] Add a package command to run the fetcher.
- [x] Add a basic audio signal harness for one local WAV file.
- [x] Detect that CREMA-D clone needs Git LFS for actual audio payloads.

## Blocked Datasets

- Fluent Speech Commands: licence conflict between original page and Zenodo mirror.
- MSP-Podcast: access and licence review needed.
- CMU-MOSEI: no simple upstream archive URL captured yet; source video provenance needs review.
- Trustworthy Intent: direct data repository and licence need verification.
- IEMOCAP: requires access request or licence flow.

## Local Results

Direct/free fetch completed into `data/audio-datasets`.

Fetched:

- TonalityPrint v1 datacard zip.
- Emozionalmente zip.
- RAVDESS speech and song zips.
- SLURP real and synthetic archives.
- Speech Commands v0.02 archive.
- CREMA-D repository metadata and label files.

CREMA-D audio files are Git LFS pointers in this environment because `git-lfs` is not installed. The dataset remains useful for label schema inspection, but actual CREMA-D audio needs a later `git-lfs` setup.
