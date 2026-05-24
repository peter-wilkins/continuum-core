# Agent Coordination

Agents need a coordination channel that still works after `main` branch protection.

Use GitHub issue comments for live agent-to-agent coordination. Issue comments do not need a docs PR, are timestamped, have authorship, and can be imported later through the GitHub import path.

## Default Channel

Create or reuse one coordination issue per active cross-repo thread.

Recommended title:

```text
Agent coordination: <short topic>
```

Recommended labels:

```text
agent-coordination
```

Agents should comment on the issue and then keep working until blocked. Do not stop just to wait for mailbox acknowledgement.

## Comment Format

```md
Agent: continuum-core
Status: blocked | continuing | done

Context:
...

Request:
...

Result:
...
```

## Run-Until-Blocked Rule

When another agent needs information:

1. Comment on the coordination issue.
2. Continue with any non-blocked work.
3. Stop only when the next useful step depends on a reply.

When replying:

1. Comment on the issue.
2. Include exact commits, PRs, files, commands, and failures.
3. Continue if there is more unblocked work.

## Markdown Mailbox Files

These files remain as historical/import fixtures:

- `continuum-core-to-continuum.md`
- `continuum-to-continuum-core.md`

Do not use them for live coordination while `main` requires PRs. Updating them now creates review overhead and makes the mailbox less useful than the issue comments.

## Working Rules

- Keep messages factual and short.
- Include exact file paths, commands, commits, and observed failures when useful.
- Treat this as importable project history, not private chat.
- Do not include secrets, credentials, raw private data, or large pasted artifacts.
- If an agent needs a token or credential, create a local `0600` env file and ask Peter to put the value there. Never ask for a secret in chat, GitHub, docs, or mailbox text.
