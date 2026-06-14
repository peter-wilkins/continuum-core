# Codex Conversation Search

This is a rebuildable SQLite FTS5 Local Source Cache over conversation-flow
projection files.

Source truth remains:

```text
local/codex-session-conversations/conversation-flow/*.conversation-flow.txt
```

The SQLite database can be deleted and rebuilt.

## Build Index

```bash
npm run build
node dist/codex-conversation-search-cli.js index \
  local/codex-session-conversations/conversation-flow \
  --db local/codex-session-conversations/search-cache/search.sqlite \
  --reset
```

## Search

```bash
node dist/codex-conversation-search-cli.js search "extended thought" \
  --db local/codex-session-conversations/search-cache/search.sqlite \
  --limit 10
```

The query is converted into an `AND` search over words, so `extended thought`
finds messages containing both words without needing FTS syntax.

## Why SQLite

`rg` remains the fastest zero-setup fallback for exact text archaeology.

SQLite FTS5 adds:

- ranked results
- snippets
- speaker/path/message metadata
- a future UI-friendly query surface

Do not treat the SQLite file as source truth. It belongs under gitignored
`local/`.
