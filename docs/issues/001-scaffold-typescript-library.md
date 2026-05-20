# 001: Scaffold TypeScript Library

## Goal

Create the minimal standalone TypeScript package that Host Apps can install or link locally.

## Acceptance Criteria

- `package.json` defines a library package targeting `@continuum/core`.
- Build emits ESM and CJS outputs plus type declarations.
- `npm test`, `npm run build`, and `npm run typecheck` exist.
- Tooling uses TypeScript, `tsup`, and `vitest`.
- Source lives under `src/`; public exports come from `src/index.ts`.
- No UI, microphone, DB server, model provider, or Host App code is introduced.

## Notes

- Sibling `continuum` uses npm/package-lock, so this repo should use npm for first iteration.
- Keep package usable through local file linking before any npm publishing decision.
