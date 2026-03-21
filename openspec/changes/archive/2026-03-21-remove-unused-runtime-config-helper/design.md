## Context

The Electron runtime currently determines development versus production behavior in `src/electron/main.ts`. A separate Node runtime config helper exists in `src/node/config.ts`, but no active runtime path imports or depends on it. This creates a second, unused abstraction for environment behavior and can mislead contributors about where startup configuration is actually enforced.

## Goals / Non-Goals

**Goals:**
- Remove the unused runtime config helper so environment behavior has one active source of truth.
- Keep existing Electron renderer loading behavior unchanged for development and production.
- Align OpenSpec requirements with the active startup path rather than dormant abstractions.

**Non-Goals:**
- Introducing a new shared cross-process configuration system.
- Changing Electron window lifecycle behavior or preload contracts.
- Expanding renderer configuration scope beyond current startup mode routing.

## Decisions

- Keep environment-mode routing in the Electron main process startup path and remove the unused Node helper module.
  - Rationale: preserves current behavior while reducing ambiguity and maintenance noise.
  - Alternative considered: keep the helper for anticipated future reuse. Rejected because there are no current consumers and it duplicates live logic.
- Update capability requirements to explicitly describe behavior in terms of active startup code paths.
  - Rationale: requirements should describe enforceable behavior, not optional or unused structure.
  - Alternative considered: no spec delta because runtime behavior is unchanged. Rejected to avoid mismatch between repository intent and currently active architecture constraints.

## Risks / Trade-offs

- [Future central config work may need reintroduction] -> Mitigation: reintroduce shared config only when at least two active runtime consumers require it.
- [Perception of over-cleanup for a small file] -> Mitigation: keep scope narrow and document no-behavior-change intent in proposal/tasks.
- [Spec wording drift from implementation reality] -> Mitigation: tie modified requirement scenarios directly to startup behavior currently executed in Electron main.

## Migration Plan

1. Remove unused runtime config module from source and ensure Node target build output no longer emits it.
2. Keep Electron startup mode selection and renderer loading logic intact in active entrypoint code.
3. Run typecheck/build/test workflow to verify no behavioral regressions.

Rollback strategy:
- Restore removed config module if a regression is detected, then re-evaluate cleanup scope with explicit consumer mapping.

## Open Questions

- Should a future central runtime config boundary be created only when renderer-safe and main-process config contracts are both required?
