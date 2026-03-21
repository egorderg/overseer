# AGENTS Guide (`overseer`)

This guide is for agentic coding assistants working in this repo.

## Non-Negotiables

- Ignore `TODO.md` completely.
- Prefer minimal, targeted diffs.
- Do not hand-edit generated files in `dist/` unless explicitly requested.
- Keep edits TypeScript-first and aligned with existing architecture.

## Project Overview

- App type: Electron desktop app with React renderer.
- Language: TypeScript (with strict settings in practice).
- Build tools: `tsc` + Vite.
- Styling: Tailwind CSS.
- Lint/format: Biome.
- Tests: Node's built-in test runner (`node --test`).

## Important Paths

- `src/electron/` -> Electron main/preload + local persistence logic.
- `src/react/` -> React UI and components.
- `src/renderer/` -> renderer bridge usage/types glue.
- `src/shared/` -> cross-process contracts/types.
- `scripts/` -> smoke checks and Node test scripts.
- `.github/workflows/ci.yml` -> CI behavior.

## Environment and Tooling

- Package manager: `npm`.
- Lockfile: `package-lock.json`.
- CI node version: Node 22.
- Local mise config pins Node 24 (`mise.toml`).

## Setup

```bash
npm ci
```

## Build Commands

- Full build: `npm run build`
- Electron/shared TS: `npm run build:electron`
- Renderer TS: `npm run build:renderer`
- React bundle: `npm run build:react`

## Dev/Run Commands

- Full dev flow (React + Electron): `npm run dev`
- React dev server only: `npm run dev:react`
- Electron (expects dev server): `npm run dev:electron`
- Build then launch app: `npm run start`
- Launch built app directly: `npm run start:electron`

## Lint and Typecheck

- Lint: `npm run lint`
- Full typecheck: `npm run typecheck`
- Per-target typecheck:
  - `npm run typecheck:electron`
  - `npm run typecheck:renderer`
  - `npm run typecheck:react`

## Test Commands

- Full test pipeline: `npm test`
- Preload contract smoke test: `npm run smoke:preload-contracts`
- Workspace storage tests: `npm run test:workspace-storage`

## Running One Test (Single Test Focus)

The primary test file is `scripts/workspace-storage.test.mjs`.

- Run one test by name (recommended):

```bash
npm run test:workspace-storage -- --test-name-pattern="rejects duplicate"
```

- Equivalent direct command:

```bash
node --test scripts/workspace-storage.test.mjs --test-name-pattern="rejects duplicate"
```

Notes:

- `npm run test:workspace-storage` runs `build:electron` first.
- Use direct `node --test` only if you already built the Electron output.

## CI Contract

Current CI workflow runs:

1. `npm ci`
2. `npm run typecheck`

Before proposing changes, run at least `npm run typecheck`.
For Electron/preload/workspace logic changes, run `npm test` as well.
