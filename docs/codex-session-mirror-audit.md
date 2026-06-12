# Codex Session Mirror Audit

This is the first non-destructive storage slice for the Codex session mirror.

It treats `data/codex/session-mirror` as cold Source Log material. The audit is
only a small local report. It is not cleanup, compression, or migration.

## Safety Rules

- Do not delete raw blobs.
- Do not rewrite raw blobs.
- Do not commit generated reports.
- Do not upload raw session content.
- Keep report output under `local/reports`, which is gitignored.

## Run

```bash
npm run codex:session-mirror:audit
```

Equivalent direct command after `npm run build`:

```bash
node dist/codex-session-mirror-audit-cli.js data/codex/session-mirror
```

The command writes:

```text
local/reports/codex-session-mirror-storage/<timestamp>/summary.md
local/reports/codex-session-mirror-storage/<timestamp>/summary.json
```

## What It Reports

- total bytes and file count
- size histogram
- newest, oldest, and largest files
- exact duplicates among same-size files, bounded by a hash byte limit
- sampled JSONL event/type and role histograms
- rough conversation projection size estimate
- recommended next action

The report does not include raw JSONL line content.

## Bounds

The duplicate pass only hashes files that have at least one same-size peer. It
stops at `--duplicate-hash-byte-limit` and records a warning if the exact
duplicate count is partial.

The JSONL shape pass reads only a small number of files and lines:

```bash
node dist/codex-session-mirror-audit-cli.js data/codex/session-mirror \
  --sample-files 6 \
  --sample-lines 200 \
  --duplicate-hash-byte-limit 2147483648
```

Use a higher hash byte limit only when there is enough time and disk pressure is
not being made worse by other processes.
