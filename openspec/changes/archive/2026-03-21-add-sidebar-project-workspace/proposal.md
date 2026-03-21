## Why

Users need a fast way to register and revisit local project folders without manually editing configuration files. Adding projects directly from the sidebar improves discoverability and aligns with the workspace-oriented IDE model.

## What Changes

- Add an "Add Project" action in the sidebar that prompts for a folder path and creates a new project entry.
- Use the selected folder's basename as the sidebar project name (for example, `/dev/apps/overseer` -> `overseer`) instead of displaying the full path.
- Persist the workspace project list to a central `workspace.json` file under `~/.overseer/`.
- Load sidebar project items from `~/.overseer/workspace.json` on startup so projects are restored across sessions.
- Ensure new project entries are validated (path exists, avoid duplicates) before persisting.

## Capabilities

### New Capabilities
- `workspace-project-sidebar-management`: Manage workspace projects from the sidebar, including adding local folders and persisting them centrally.

### Modified Capabilities
- None.

## Impact

- Affected code: sidebar UI components, workspace state management, and config persistence layer.
- Files/data: introduces or standardizes central storage in `~/.overseer/workspace.json`.
- Behavior: project list becomes user-manageable from UI and persists between app restarts.
