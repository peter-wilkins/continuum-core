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
