## Why

The Electron app fails at startup because the preload bundle cannot resolve `../shared/contracts`, which prevents the renderer from accessing required APIs like `getAppInfo`. This blocks basic app initialization and should be fixed now to restore a working desktop runtime.

## What Changes

- Define and enforce a stable preload-to-shared contract import strategy that survives bundling into `dist/electron`.
- Update preload and build configuration so shared contract modules are packaged and resolvable at runtime.
- Add startup validation and test coverage for the preload API surface used by renderer features such as app info rendering.
- Improve failure visibility by surfacing preload contract loading errors with actionable diagnostics.

## Capabilities

### New Capabilities
- `electron-preload-contract-loading`: Ensure preload can load shared contract modules in packaged and development builds and expose expected bridge APIs.

### Modified Capabilities
- None.

## Impact

- Affected code: Electron preload entry, shared contract module exports, and Electron build/packaging configuration.
- Affected APIs: Renderer-facing preload bridge methods (including app info retrieval).
- Affected systems: Electron startup path, desktop bundling outputs under `dist/electron`, and runtime diagnostics.
