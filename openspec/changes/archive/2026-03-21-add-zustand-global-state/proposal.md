## Why

The application needs a centralized state management solution to handle project selection, per-project views (explorer, diff, terminals), and view state preservation. As the UI grows from a simple project display to an IDE-like interface with multiple views per project, prop drilling and local component state become insufficient. Global state is needed to maintain consistent state across the sidebar and main content area, and to preserve view-specific state when switching between projects and views.

## What Changes

- Add Zustand as a dependency for global state management
- Create a central store to manage:
  - Project registry and selection state
  - Per-project views (explorer, diff, dynamic terminals with custom names)
  - View-specific state preservation (eager initialization)
- Update ProjectsSidebar to support project selection and view navigation
- Update App.tsx to consume store instead of local state
- Create view components for explorer, diff, and terminal views
- Integrate store with existing project loading from workspace.json
- Implement auto-selection of explorer view when project is selected

## Capabilities

### New Capabilities

- `project-view-state-management`: Centralized state management for projects, views, and per-view state preservation. Handles project selection, view navigation (explorer, diff, terminals), and maintains view-specific state across navigation.

### Modified Capabilities

None. Existing workspace-project-sidebar-management capabilities remain unchanged.

## Impact

- **Dependencies**: Adding Zustand package
- **Components**: App.tsx, ProjectsSidebar.tsx will be refactored to use store. New view components (ExplorerView, DiffView, TerminalView) will be created.
- **State flow**: Moves from prop drilling to centralized store consumption
- **Integration**: Store will consume existing IPC methods (getWorkspaceProjects) to initialize project state on startup
