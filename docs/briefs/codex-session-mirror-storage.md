# Codex Session Mirror Storage Brief

## Status

Ready for Continuum agent.

## Trigger

The laptop root disk filled up during Field Relay and Continuum dogfooding. Old
audio was partly cleared after Peter confirmed it was backed up, but the main
remaining storage pressure is the Codex session mirror.

Current observed size:

- `/home/peter/continuum-core/data/codex/session-mirror/blobs`: about 236GB
- Blob count: 5,297 JSONL files
- Largest observed files: about 224-231MB each
- Many largest files were written on 2026-06-11 and 2026-06-12

This brief is about reducing storage pressure without losing source history.

## Resolved Decision

Treat the raw Codex session mirror as precious but cold.

Recommended policy:

- keep one recoverable compressed raw copy
- build a much smaller day-to-day conversational projection
- prune local uncompressed raw mirror only after a restore test proves the raw
  data can be recovered

## Safety Boundary

Do not delete, rewrite, or replace the raw session mirror as part of the first
slice.

Allowed first-slice actions:

- inspect file sizes, hashes, JSONL shape, reference manifests, and timestamps
- sample compression ratios without writing large outputs
- write small reports, scripts, synthetic fixtures, and tests
- write a derived conversational projection into a new local-only path

Blocked until explicit approval:

- deleting raw session mirror blobs
- replacing raw JSONL blobs with compressed files
- pushing raw private session content to GitHub or any external service
- uploading samples to third-party tools

## Existing Continuum Language To Use

Use existing domain terms rather than inventing a new archive model:

- **Source Log**: source truth for captured context
- **Local Source Cache**: disposable, rebuildable local read model
- **File System Membrane**: storage policy for raw artifacts, retention, quotas,
  checksums, and erasure behaviour
- **Artifact Reference**: durable reference to raw captured artifacts
- **Materialized View**: rebuildable projection for display, inspection, or
  feedback

The Codex session mirror should be treated as raw/cold source material. The
conversational extraction should be a rebuildable Materialized View or Local
Source Cache-like read model, not replacement source truth.

## Questions To Answer

1. Is exact duplication happening?
   - Count files by hash and path.
   - Check whether content-addressed storage is already preventing exact
     duplicates.
   - Check whether multiple indexes or manifests point at the same blobs.

2. Is near-duplication or snapshot inefficiency happening?
   - Inspect representative large JSONL files.
   - Determine whether each large file is a full session snapshot, a growing
     history copy, or a true independent session.
   - Estimate how much repeated prompt/context/tool output exists across files.

3. How well does zstd work?
   - Measure a representative sample without creating permanent output first.
   - Use small, medium, and large files from different dates.
   - Record compression ratio and CPU time.
   - Compare at least `zstd -3`, `zstd -10`, and `zstd --long -10` if available.

4. What is the smallest useful conversational projection?
   - Preserve user-visible conversation turns.
   - Preserve timestamps, source ids, session ids, roles, and ordering.
   - Preserve links back to raw blob hash/path and byte/line positions when
     feasible.
   - Summarise or reference large tool outputs rather than copying them.
   - Keep enough structure to rebuild Continuum Entries later.

5. What retention tiers make sense?
   - Hot: small conversational projection for search, inspection, and retrieval.
   - Warm: compressed raw mirror on the laptop if space permits.
   - Cold: full raw compressed mirror on SSD/recovery disk.
   - Disposable: rebuildable caches, indexes, previews, and generated reports.

## Proposed First Slice

Build an audit-and-report command, not a cleanup command.

Input:

- `data/codex/session-mirror`

Output:

- `local/reports/codex-session-mirror-storage/YYYYMMDD-HHMMSS/summary.md`
- `local/reports/codex-session-mirror-storage/YYYYMMDD-HHMMSS/summary.json`

Report fields:

- total bytes and file count
- size histogram
- newest and oldest blob timestamps
- largest files
- exact duplicate count if any
- sample zstd ratios
- JSONL event/type histogram from sampled files
- estimate of conversational projection size
- recommended next action

The command should be safe to run repeatedly and should not require network.

## Proposed Second Slice

Build a conversational projection extractor.

Input:

- raw session mirror JSONL blobs

Output:

- `local/codex-session-conversations/events.jsonl`
- optional compact per-session files under
  `local/codex-session-conversations/sessions/`

Projection record shape:

```json
{
  "projectionVersion": 1,
  "sourceBlobSha256": "...",
  "sourceBlobPath": "data/codex/session-mirror/blobs/sha256/...",
  "sourceLine": 123,
  "sessionId": "...",
  "eventId": "...",
  "occurredAt": "2026-06-12T07:13:00Z",
  "role": "user|assistant|system|tool",
  "text": "...",
  "textKind": "conversation|tool-summary|tool-output-reference|unknown",
  "redactionState": "raw-local-only|redacted|safe-summary",
  "rawEventJson": {}
}
```

Notes:

- `rawEventJson` can be omitted or kept only for tiny safe records if it bloats
  the projection.
- Large tool output should usually become a reference or short summary, not a
  copied payload.
- If the JSONL schema varies, start with a permissive parser that records
  unknown event shapes in the report rather than failing the whole run.

## Future Capture Fix

The long-term fix is not only compressing old blobs. The mirror should capture
more efficiently at source.

Target future shape:

- capture conversational turns first
- capture tool calls as structured events
- store large command output, code, diffs, file contents, and build logs as
  references or short summaries by default
- prefer Git commit hashes, repository paths, file paths, and line references
  over copying code that already exists in GitHub
- preserve enough source references for a future agent to recover context
  without turning every session mirror into a full code archive

This is especially important because code and build artifacts usually have a
better source of truth:

- GitHub for committed code
- local git working tree for uncommitted code
- CI logs for build output
- rebuildable package caches for dependencies

The mirror should optimise for resuming the human/agent conversation, not for
duplicating every byte the tools saw.

Open design question:

- Should raw tool output be retained only when it is small, explicitly marked
  important, or not recoverable from another source?

## Proposed Tests

Use synthetic fixtures only.

Test cases:

- exact duplicate blobs are reported without deletion
- repeated large tool output is not copied into the projection
- user and assistant text turns preserve ordering
- source blob hash/path and line number are preserved
- malformed JSONL lines are counted and quarantined
- projection can be rebuilt deterministically from the same fixture

## Success Criteria

The first useful result is a clear report that says:

- how much of the 236GB is raw independent material
- how much compression is likely to recover
- how small the conversational projection is likely to be
- which data is safe to move to SSD, compress, or regenerate

No raw data should be deleted until:

1. the report exists
2. compressed restore has been tested on a sample
3. Peter explicitly approves the chosen retention tier

## Suggested Next Agent Prompt

Use this prompt for the Continuum agent:

```text
Read docs/briefs/codex-session-mirror-storage.md. Build the first non-destructive
audit-and-report slice for data/codex/session-mirror. Do not delete or rewrite
raw blobs. Produce a local report under local/reports/codex-session-mirror-storage
and commit only scripts/docs/tests/synthetic fixtures, not raw reports or private
data.
```
