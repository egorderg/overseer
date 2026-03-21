## Why

The repository includes a runtime configuration helper that is not used by any active code path. Keeping an unused config abstraction creates confusion about the source of truth for environment behavior and increases maintenance overhead.

## What Changes

- Remove the unused Node runtime config helper module (`src/node/config.ts`) and its build artifact from the active source layout.
- Keep environment mode selection in the Electron main process entrypoint, which is the only current caller path for runtime environment decisions.
- Document the cleanup as intentional so future central config work is introduced only when real cross-process consumers exist.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `electron-react-shell`: Clarify that development/production renderer loading behavior is sourced from active startup code paths without unused alternate config modules.

## Impact

- Affected code: `src/node/config.ts`, Node TS build inputs/outputs, and OpenSpec delta for `electron-react-shell`.
- Dependencies: none.
- Systems: Electron startup behavior documentation and repository maintainability.
