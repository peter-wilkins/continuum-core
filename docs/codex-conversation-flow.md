# Codex Conversation Flow Projection

This projection is the small, reviewable form Peter wants to keep hot:

```text
Peter:
<human message>

Agent:
<agent answer or summary>
```

It is a Materialized View of the raw Codex session mirror, not source truth.

## Keep

- user messages
- assistant messages
- blank line between messages

## Drop

- developer/system setup
- Codex environment context
- reasoning records
- tool calls
- command output
- code diffs and build logs unless they were explicitly in a kept user or
  assistant message

## Run One Blob

Build first:

```bash
npm run build
```

Then run:

```bash
node dist/codex-conversation-flow-cli.js <blob.jsonl> \
  --out local/reports/codex-conversation-flow-review/latest
```

Output:

```text
local/reports/codex-conversation-flow-review/latest/conversation-flow.txt
local/reports/codex-conversation-flow-review/latest/summary.json
```

The output is private and local-only. `local/` is gitignored.

## Emergency Batch Mode

Use this only when Peter has explicitly approved deleting raw mirror blobs after
projection.

```bash
node dist/codex-conversation-flow-batch-cli.js data/codex/session-mirror/blobs \
  --delete-raw-after-projection \
  --limit 25 \
  --minimum-source-bytes 1048576 \
  --minimum-age-seconds 60 \
  --out local/codex-session-conversations/conversation-flow \
  --manifest local/codex-session-conversations/conversation-flow-manifest.jsonl
```

Deletion guard:

- write one projection file
- verify the projection has at least one kept Peter/Agent message
- append a local manifest record
- delete that one raw blob

If a blob produces no kept messages, the raw blob is left in place.

By default the batch command:

- ignores blobs modified in the last 60 seconds
- skips sources already recorded in the manifest

## User Timer

The local timer files are:

```text
docs/systemd/continuum-codex-conversation-flow-cleanup.service
docs/systemd/continuum-codex-conversation-flow-cleanup.timer
```

The timer runs every 15 minutes and uses `flock` so overlapping runs exit
without touching files.
