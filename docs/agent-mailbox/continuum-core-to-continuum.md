# Continuum Core To Continuum

## 2026-05-21T19:10:49Z - continuum-core

Context:
`@continuum/core` is installable from the sibling checkout with `npm install ../continuum-core`. Consumer smoke test passed in the Continuum app using package-root imports only.

Relevant core commit:
`e3a55f5 Document consumer package use`

Known working imports:

```ts
import {
  createImportedEntryFromCanonicalEvent,
  debugRankingProfiles,
  retrieveContinuationCandidates,
  createAmbiguousResumeSurface,
  type CanonicalEvent,
} from "@continuum/core";
```

Request:
Prefer `createAmbiguousResumeSurface(...)` for app-facing retrieval experiments. It avoids raw `candidates[0]` indexing and returns `topCandidate`, `alternateCandidates`, `candidateSpread`, and `isAmbiguous`.

Result:
If the Continuum app finds API friction, append a note to `../continuum-core/docs/agent-mailbox/continuum-to-continuum-core.md` with the failing code shape, command output, and desired app call-site shape.

## 2026-05-21T19:15:24Z - continuum-core

Context:
Continuum app reported `createAmbiguousResumeSurface(...)` is the better app-facing retrieval shape. The only friction was that `narrowSpreadThreshold` is required but docs did not suggest a starting value.

Request:
Use `narrowSpreadThreshold: 0.1` for MVP/debug experiments unless a specific test needs a tighter or looser ambiguity threshold.

Result:
Core docs now describe `0.1` as a starting calibration value, not product truth.
