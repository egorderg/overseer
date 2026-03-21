# TypeScript Migration Guide

## Minimum Conventions

- Keep cross-module contracts in `src/shared` and import types from there.
- Prefer `interface` for payload contracts exchanged between process boundaries.
- Do not use `any`; use `unknown` plus narrowing when exact shapes are not yet known.
- Keep `strictNullChecks` enabled and model nullable values explicitly.
- Add types at module boundaries first, then migrate internals.

## High-Risk Boundaries

- API payload shapes (server/client request and response objects).
- Electron IPC channels (`ipcMain.handle` and `ipcRenderer.invoke`).
- Shared runtime configuration consumed by multiple modules.

This change introduces typed contracts for IPC and runtime configuration:

- `src/shared/contracts.ts` for IPC channel and payload types.
- `src/node/config.ts` for runtime configuration typing.

## Runtime Parity Verification

- Build output with `npm run build`.
- Validate type compatibility with `npm run typecheck`.
- Start Electron with `npm start` and confirm app info renders in the renderer.

## Temporary Migration Exceptions

- Current suppressions: none.
- If suppressions are introduced, add them to this section with owner and removal target date.

## Strictness Phase Criteria

Phase 1 (current):

- `strict` enabled with incremental migration support via `allowJs`.
- No unresolved TypeScript errors in CI.

Phase 2 (next):

- Enable `noImplicitAny` and fail CI on any new implicit `any` usage.
- Require typed contracts for all new IPC/API boundary changes.

Phase 3 (follow-up backlog):

- Remove `allowJs` from TypeScript configs once core modules are migrated.
- Migrate remaining JavaScript modules to `.ts`/`.tsx`.
- Add ESLint/Biome rule set for boundary typing conventions.
