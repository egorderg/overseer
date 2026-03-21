## Purpose
Define reliable preload contract loading and bridge availability expectations across development and packaged Electron runtimes.

## Requirements

### Requirement: Preload resolves shared contracts in all runtime modes
The preload entrypoint MUST import shared contract modules through a path strategy that resolves correctly in development and packaged Electron builds.

#### Scenario: Development preload startup
- **WHEN** the app starts in development mode and executes preload initialization
- **THEN** preload resolves shared contract imports without module resolution errors

#### Scenario: Packaged preload startup
- **WHEN** the app starts from packaged distribution output and executes preload initialization
- **THEN** preload resolves shared contract imports without module resolution errors

### Requirement: Renderer bridge APIs are registered after preload bootstrap
The system MUST expose the required renderer bridge contract methods after preload bootstrap completes successfully.

#### Scenario: App info bridge availability
- **WHEN** renderer code requests app info through the preload bridge
- **THEN** the `getAppInfo` method is defined and returns app metadata without throwing due to missing preload APIs

### Requirement: Preload contract bootstrap failures are observable
The system MUST emit actionable diagnostics when preload cannot load required contract modules.

#### Scenario: Missing contract module
- **WHEN** preload fails to load a required shared contract module at startup
- **THEN** startup logging includes the unresolved module and preload bootstrap failure context sufficient for debugging
