# Backup Storage Notes

Current scan date: 2026-06-14.

## Current Large Areas

- `local/codex-session-conversations/search-cache`: rebuildable SQLite FTS cache.
- `data/audio-datasets`: about 9.7GB.
  Public or manually fetched research datasets from `npm run audio-datasets:fetch`.
- `data/codex/session-mirror`: about 1.8GB after compaction.
  Raw Codex mirror. The timer is still active and can grow this again.
- `local/codex-session-conversations/conversation-flow`: about 3.8GB.
  Conversation-flow projection. This is useful source material for blog/search.
- `data/landing-queue/audio-captures`: about 256MB.
  Raw captured audio. Treat as source truth unless Peter confirms otherwise.

## Recommended Backup Excludes

Use:

```bash
rsync -a --delete \
  --exclude-from=/home/peter/.backup/rsync-home.exclude \
  /home/peter/ <backup-target>/home-peter/
```

The shared exclude file lives outside this repo so other projects can add their
own rebuildable caches:

```text
/home/peter/.backup/rsync-home.exclude
```

Continuum's entries are conservative. They exclude:

- `node_modules`
- `dist`
- test/build caches
- local reports
- SQLite search cache folder
- public/re-fetchable audio datasets
- stale `.tmp` files from the Codex mirror

## Do Not Exclude By Default

- `local/codex-session-conversations/conversation-flow`
- `local/codex-session-conversations/conversation-flow-manifest.jsonl`
- `data/landing-queue/audio-captures`
- private import samples under `data/`

## Optional Policy Exclude

`data/codex/session-mirror` is now mostly cold raw material. If the backup goal is
only to preserve the useful human/agent conversation flow, it can be excluded
after confirming the projection is enough.

Do not put it in the default exclude file yet because raw mirror blobs are not
fully rebuildable from the projection.

## Backup Tool Notes

- Fresh copy to an empty disk sees current file sizes.
- `rsync --delete` removes files deleted locally from the backup target.
- `rsync` without `--delete` leaves old deleted giant files on the target.
- Snapshot tools such as borg/restic need prune/forget/compact to physically
  reclaim old deleted blobs.
- Filesystem snapshots keep deleted files until old snapshots are removed.

## Before Today's Backup

The Codex mirror timer is active:

```bash
systemctl --user is-active workflow-manager-codex-session-mirror.timer
```

For the smallest stable backup, pause it before backup and restart it after:

```bash
systemctl --user stop workflow-manager-codex-session-mirror.timer
# run backup
systemctl --user start workflow-manager-codex-session-mirror.timer
```
