## 1. Contract Import Boundary

- [x] 1.1 Audit preload and adjacent Electron modules for relative imports of shared contracts.
- [x] 1.2 Define and implement a canonical shared-contract import path (alias or package export) for preload usage.
- [x] 1.3 Update preload contract imports to use the canonical boundary and remove brittle relative traversals.

## 2. Build and Packaging Alignment

- [x] 2.1 Update Electron bundling/packaging config so shared contract modules required by preload are included in runtime output.
- [x] 2.2 Verify emitted preload artifacts resolve shared contract modules in both development and packaged output paths.

## 3. Preload Bootstrap Reliability

- [x] 3.1 Add preload bootstrap checks that confirm required bridge API methods are registered before renderer usage.
- [x] 3.2 Add actionable preload startup diagnostics for shared contract loading failures, including unresolved module context.

## 4. Regression Coverage and Validation

- [x] 4.1 Add regression tests for preload startup contract resolution in development mode.
- [x] 4.2 Add regression tests or smoke checks for packaged-build preload contract resolution.
- [x] 4.3 Add an app-info bridge validation test to ensure `getAppInfo` remains callable from renderer code.
- [x] 4.4 Run the relevant Electron startup/test commands and confirm no preload module resolution errors remain.
