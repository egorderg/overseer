## Context

The current application uses local component state in App.tsx to manage projects, app info, and UI feedback. Projects are displayed in the sidebar but are not interactive (cursor-default, no selection state). The main content area is static, showing a generic welcome page. As the application evolves toward an IDE-like interface with multiple views per project (explorer, diff, terminals with custom names), this simple state management approach will become insufficient.

The existing workspace-project-sidebar-management capability handles adding projects, validating folders, and persisting to `~/.overseer/workspace.json`, but does not address project selection or view management. The IPC contracts (WindowApi) provide methods to get and add projects, but there's no mechanism to track which project is currently selected or what view is active.

Tech stack constraints: TypeScript (strict), React, Tailwind CSS, Electron, Node.js built-in test runner. The application is an Electron desktop app with React renderer.

## Goals / Non-Goals

**Goals:**
- Centralized state management for projects and their views using Zustand
- Support project expand/collapse with clickable sidebar items
- Support multiple views per project (explorer, diff, terminals)
- Preserve view-specific state when switching between projects and views
- Eager initialization of view states (create on project load, not on first view)
- Dynamic terminal creation with custom names (multiple terminals per project)
- Main window shows selected view only when a sub-entry is clicked (not when project is clicked)

**Non-Goals:**
- State persistence to disk (in-memory only)
- Complex view composition (views are mutually exclusive)
- Terminal process management (only state tracking)
- Project renaming or deletion
- Drag-and-drop project reordering
- Advanced IDE features (debugger, profiler, etc.)

## Decisions

**State Management: Zustand**

Chose Zustand over React Context, Redux, or Jotai because:
- Lightweight boilerplate compared to Redux
- Simpler API than Context+useReducer for nested state
- No provider setup needed (hooks-based consumption)
- Good TypeScript support
- Scales well to the expected complexity (~2-3 levels of nesting)

Alternatives considered:
- React Context + useReducer: More boilerplate, requires provider wrapping
- Redux: Overkill for this complexity, more boilerplate than needed
- Jotai: More atomic approach, but we need structured project state which fits Zustand better

**Store Structure: Projects keyed by path**

Projects are stored in a Record<string, ProjectState> keyed by their filesystem path. This ensures uniqueness (since paths are unique) and enables O(1) lookups. The WorkspaceProject type from existing contracts already uses path as the primary identifier, making this natural.

Per-project state includes:
- `expanded`: Boolean tracking whether the project's sub-entries are visible in sidebar
- `views`: Array of view definitions (explorer, diff, terminals)
- `viewStates`: Record<string, ViewState> with eager initialization
- `selectedView`: Currently active view ID (or null) - only set when a sub-entry is clicked

**View Types: Hardcoded + Dynamic terminals**

Explorer and diff views are hardcoded (type: 'explorer', type: 'diff'). Terminal views are dynamic with unique IDs and custom labels (type: 'terminal', id: string, label: string). Terminal IDs use a timestamp-based pattern (e.g., `terminal-1234567890-abc123`) to ensure uniqueness without coordination.

**Eager State Initialization**

View states are created when a project is loaded, not on first view access. This simplifies state management and ensures all view states exist when needed. For terminals, the state object is initialized with an empty record (terminals: {}), and individual terminal states are added when terminals are created.

**Project expand/collapse on sidebar interaction**

When a user clicks on a project row in the sidebar, the project's expanded state toggles. This does not change the main window content. The main window only changes when a user clicks a sub-entry (explorer, diff, or terminal) under the expanded project. The system tracks expanded state per project to maintain the sidebar layout across interactions.

**Integration with existing IPC**

The store will use the existing `window.overseer.getWorkspaceProjects()` IPC method to load projects on startup. The `loadProject` action in the store initializes state for each project from the workspace file. This reuses the existing workspace persistence mechanism without modifying it.

## Risks / Trade-offs

**Risk: Store complexity may grow as new views are added**

As the application evolves and new view types are added (e.g., debugger, profiler), the ProjectViewState type may need frequent updates, and the viewStates structure may become complex.

Mitigation: Keep view state interfaces simple and modular. Consider extracting view-specific state into separate stores if complexity grows beyond 3-4 view types.

**Trade-off: Eager initialization vs memory efficiency**

Eager initialization creates view state objects for all views upfront, even if some views are never used. This consumes more memory but simplifies state management.

Mitigation: The overhead is minimal for 2-3 hardcoded views. Dynamic terminals only allocate state when created, so unused terminals don't consume resources.

**Risk: Terminal ID collisions**

Using timestamp + random for terminal IDs could theoretically collide, though probability is extremely low.

Mitigation: If this becomes a concern, use a UUID or counter-based ID generation. The current approach is sufficient for the expected number of terminals (<10 per project).

**Risk: Prop drilling removal may introduce coupling**

Removing prop drilling in favor of store access means components become coupled to the store structure. If the store changes, multiple components may need updates.

Mitigation: Store structure should be considered stable API. Use TypeScript to enforce contracts and catch breaking changes at compile time.
