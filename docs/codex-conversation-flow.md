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
