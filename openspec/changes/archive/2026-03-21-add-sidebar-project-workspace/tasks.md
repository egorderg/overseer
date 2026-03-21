## 1. Sidebar Add Project Flow

- [x] 1.1 Add an "Add Project" control to the sidebar and wire it to the existing UI action system.
- [x] 1.2 Implement folder selection prompt flow and map selected folder data into a new project draft.
- [x] 1.3 Derive each project's display name from the selected folder basename while keeping full normalized path in project data.
- [x] 1.4 Render newly added project entries in the sidebar list after successful creation.

## 2. Workspace Persistence Layer

- [x] 2.1 Add workspace storage helpers for reading and writing `~/.overseer/workspace.json` with create-if-missing behavior.
- [x] 2.2 Implement atomic write semantics for workspace persistence (temporary file + rename) and error propagation.
- [x] 2.3 Load and hydrate sidebar project state from `~/.overseer/workspace.json` during application startup.

## 3. Validation and Error Handling

- [x] 3.1 Normalize selected folder paths before comparison and persistence.
- [x] 3.2 Prevent duplicate project entries by checking normalized paths against existing workspace projects.
- [x] 3.3 Reject non-existent folder paths and surface user-facing validation feedback.
- [x] 3.4 Ensure persistence failures do not update in-memory sidebar state and show an actionable error message.

## 4. Verification

- [x] 4.1 Add/update tests for add-project success path, duplicate rejection, invalid path rejection, and startup hydration.
- [x] 4.2 Add/update tests for persistence failure behavior to confirm no ghost sidebar project is displayed.
- [x] 4.3 Run relevant test suites and confirm all new workspace sidebar flows pass.
