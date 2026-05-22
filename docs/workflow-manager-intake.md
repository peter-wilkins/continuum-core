# Workflow Manager Intake

Workflow Manager is a sibling local-first project that can produce useful Continuum inputs, shared utilities, and worker handoffs.

Use it as a source of awareness, not as a reason to absorb every side project into Continuum Core.

## How To Check It

From `/home/peter/workflow-manager`:

```bash
scripts/project_status.py
```

Also inspect when relevant:

- `docs/shared-projects.md`
- `docs/project-ideas.md`
- `docs/backlog.md`
- `docs/source-inventory.md`
- `local/source-inventory/inventory.md`

Use resource leases before touching shared resources such as phones, ports, provider accounts, or worker folders.

## How Continuum Should Use It

Continuum agents should watch Workflow Manager at natural checkpoints:

- before starting a new Continuum epic
- after a Workflow Manager worker finishes
- before building capture, audio, phone, feedback, or DevOps features
- when a sibling `/home/peter/*` project looks reusable

Do not continuously poll. Do not import raw personal data automatically. Treat Workflow Manager outputs as local evidence that may become Continuum source material, shared utilities, or future separate packages.

## Current Intake Candidates

Useful now:

- `workflow-manager`: project status, source inventory, run logs, worker handoffs, local source index.
- `whisper-wayland`: Capture Tap candidate for Raw Transcript Text and audio artifacts.
- `continuum`: Host App feedback loop, public MVP UI, local source cache.

Likely useful soon:

- `murmur-storage-afk` and `physical-trigger-afk`: Android offline audio capture and trigger experiments.
- `murmur-hardware-research`: post-MVP audio capture hardware direction.
- `vector-signal-compass` and `lumen-signal-pills`: phone feedback surface experiments that may inform Lens/Curator feedback UX.
- `kit-continuum`: future extraction path for reusable local workflow scaffolding.

Watch but do not pull yet:

- `agent-kit`: agent behaviours and skills, useful as operating rules rather than Continuum domain code.
- `provider-account-rules`: provider/account policy, likely a Shared Utility Project or ops doc.
- `tmux-shortcuts`: workflow ergonomics only.
- `ptt`: prior art for speech input; inspect before using because it may overlap with Whisper Wayland.

## Worker Use

Continuum can use Workflow Manager workers for bounded, low-risk, one-folder tasks that are easy to verify.

Use:

```bash
/home/peter/workflow-manager/scripts/start_worker.py <project> --task "<task>"
```

Only do this when parallel work actually moves Continuum forward. Prefer direct implementation in the current agent for small slices.

Workers should leave `AGENT-HANDOFF.md`, `AGENT-LAST-MESSAGE.md`, or equivalent local evidence. The Continuum agent remains responsible for review and integration.

## Pull-In Rule

Pull a sibling project into Continuum only when one of these is true:

- it produces source material Continuum should ingest
- it defines a reusable domain concept already accepted in Continuum
- it provides a shared utility that belongs outside Continuum Core but needs a Continuum adapter
- it directly improves the current MVP or the next accepted epic

Otherwise park it as future feedstock.
