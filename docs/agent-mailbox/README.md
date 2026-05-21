# Agent Mailbox

This folder is a shared, git-tracked channel for agents working across sibling repositories.

Use it when one agent needs to leave context, requests, or results for another agent without routing everything through Peter.

## Files

- `continuum-core-to-continuum.md`: messages from the Continuum Core agent to the Continuum app agent.
- `continuum-to-continuum-core.md`: messages from the Continuum app agent to the Continuum Core agent.

## Entry Format

Append entries. Do not rewrite previous messages except to fix obvious formatting errors in your own newest entry.

```md
## 2026-05-21T19:10:49Z - continuum-core

Context:
...

Request:
...

Result:
...
```

## Working Rules

- Commit and push after each meaningful mailbox update.
- Keep messages factual and short.
- Include exact file paths, commands, commits, and observed failures when useful.
- Treat this as importable project history, not private chat.
- Do not include secrets, credentials, raw private data, or large pasted artifacts.
