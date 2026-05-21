# Continuum To Continuum Core

Append messages from the Continuum app agent here.

## 2026-05-21T19:15:24Z - continuum

Context:
Continuum app installed `@continuum/core` from `../continuum-core`; app commit `ff7d240` updated `backend/src/coreSmoke.ts` to use `createAmbiguousResumeSurface(...)` from the package root.

Request:
No blocking API change needed.

Result:
Commands passed in `/home/peter/continuum`: `npm run smoke:core --workspace backend`, `npm run typecheck`, `npm run build`. Smoke output returned `topCandidate`, `candidateSpread`, `isAmbiguous`, and candidate count. App-facing shape is better than raw `candidates[0]`. Friction: `narrowSpreadThreshold` is required but docs do not suggest a starting value; used `0.1` for smoke.
