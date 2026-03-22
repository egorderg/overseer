## Why

The app currently auto-creates and auto-loads a workspace file from `~/.overseer/workspace.json`, giving users no control over where their configuration lives or how it's structured. Users should own their config file explicitly—choosing its location, name, and content—while the app becomes a passive viewer that loads and validates the config on demand.

## What Changes

- New empty state UI with a centered "Load Config" button
- File dialog opens when user clicks the button to select a JSON config file
- Config validation with detailed error messages shown in the empty state
- Projects rendered from the valid config file
- Config file is read-only from the app's perspective (user edits externally)
- Each load replaces the current state (no merging)

**Config format:**
```json
{
  "projects": [
    {
      "path": "/absolute/path/to/project",
      "name": "project-name",
      "explorer": { "enabled": true },
      "diff": { "enabled": true },
      "terminals": [{ "name": "Build" }],
      "collapsed": false
    }
  ]
}
```

## Capabilities

### New Capabilities

- `config-loader`: Load a user-provided JSON config file, validate its structure and paths, and render the defined projects. Display detailed error messages for invalid configs.

### Modified Capabilities

- None (this is a new flow; existing workspace persistence will be removed in a separate iteration)

## Impact

- New React component for empty state with "Load Config" button
- New Electron IPC channel for file dialog and config reading
- New config schema types in `shared/contracts.ts`
- New validation logic in Electron main process
- Store updated to receive projects from loaded config (replacing auto-load on startup)
- Existing workspace persistence (`~/.overseer/workspace.json`) remains for now but is no longer auto-loaded
