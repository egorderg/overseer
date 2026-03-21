## Context

The preload script currently imports shared contracts through a relative path that works in source layout but fails after Electron packaging into `dist/electron`, causing preload initialization to abort. When preload fails, `contextBridge` APIs are never exposed, so renderer code that expects `window.appApi.getAppInfo()` throws at runtime. The change must preserve security boundaries (no broad Node exposure), work in development and packaged builds, and keep contract definitions aligned across main, preload, and renderer.

## Goals / Non-Goals

**Goals:**
- Make preload contract imports resolvable in both development and packaged Electron output.
- Guarantee renderer-visible APIs are registered when preload loads successfully.
- Add regression checks so missing shared contract modules are caught before runtime failures in app startup.
- Produce actionable diagnostics when preload bootstrap fails.

**Non-Goals:**
- Redesigning the full IPC architecture or replacing existing preload API names.
- Introducing new renderer feature behavior beyond restoring expected app-info loading.
- Relaxing preload security posture or enabling unrestricted Node access in renderer.

## Decisions

- Use a single canonical import boundary for shared contracts (module alias or package export) instead of relative traversals from preload output paths.
  - Rationale: Relative paths are brittle after bundling; a canonical boundary keeps source and emitted layouts decoupled.
  - Alternative considered: Copy shared files next to preload output and keep relative import paths. Rejected because it duplicates source of truth and is easy to break during future build changes.

- Update Electron build configuration so shared contract modules are always included in preload bundle resolution.
  - Rationale: The preload runtime must never depend on files that are omitted by packaging defaults.
  - Alternative considered: Runtime fallback `require` with multiple path probes. Rejected because it hides packaging issues and complicates startup behavior.

- Add preload bootstrap validation that verifies required bridge methods are present before renderer startup depends on them.
  - Rationale: Early validation turns silent missing-module failures into explicit startup errors.
  - Alternative considered: Let renderer detect missing APIs ad hoc. Rejected because failures surface late and with less context.

- Add automated tests covering preload API registration and app-info retrieval contract.
  - Rationale: The regression is build-path-specific and should be guarded by integration-style startup checks.
  - Alternative considered: Unit-test only contract helpers. Rejected because unit tests alone do not prove packaged preload resolution.

## Risks / Trade-offs

- [Build config coupling] Changes to bundler alias/export settings may need updates across multiple config files -> Mitigation: centralize alias definition and document expected preload import path in the change tasks.
- [Test runtime cost] Startup/integration checks can increase CI time -> Mitigation: keep one focused smoke test for preload contract exposure and run broader suites unchanged.
- [Hidden legacy imports] Other preload-adjacent files may still use fragile relative shared imports -> Mitigation: include repository search and cleanup task for preload/shared import patterns.

## Migration Plan

1. Introduce canonical shared contract import path and update preload imports.
2. Update Electron build packaging/bundling config to include shared contracts for preload runtime.
3. Add preload startup validation and error logging around bridge registration.
4. Add and run regression tests for preload API availability and app-info fetch path.
5. Verify app starts successfully in development and packaged build modes.

Rollback strategy: revert alias/build config and preload import changes together to restore prior startup path if regressions appear.

## Open Questions

- Should preload validation fail fast (prevent window creation) or expose a degraded UI with an explicit error state?
- Which existing test harness (Electron integration runner vs. startup smoke script) is the most reliable place for packaged preload regression coverage?
