## 1. Setup and Dependencies

- [x] 1.1 Add Zustand as a project dependency
- [x] 1.2 Create store directory structure at `src/react/store/`
- [x] 1.3 Verify TypeScript configuration supports Zustand types

## 2. Store Implementation

- [x] 2.1 Define TypeScript types for project view state (ProjectView, ProjectState, ProjectViewState, AppState)
- [x] 2.2 Implement Zustand store with initial state structure
- [x] 2.3 Implement `loadProject` action to initialize project state from WorkspaceProject with expanded: false and selectedView: null
- [x] 2.4 Implement `toggleProject` action to toggle project expanded state
- [x] 2.5 Implement `selectView` action to set the active view for a specific project
- [x] 2.6 Implement `addTerminal` action to create dynamic terminal with custom label and unique ID
- [x] 2.7 Implement `updateViewState` action to update state for a specific view in a project
- [x] 2.8 Add selector hooks for common store queries (useProject, useCurrentView, etc.)

## 3. Component Refactoring - App.tsx

- [x] 3.1 Remove local state from App.tsx (projects, appInfo, feedback, isAddingProject)
- [x] 3.2 Integrate store initialization in App component's useEffect
- [x] 3.3 Replace local state with store selectors
- [x] 3.4 Pass store actions to ProjectsSidebar instead of callback props
- [x] 3.5 Create MainContent component that consumes store for selected project and view, showing empty/placeholder when no view is selected
- [x] 3.6 Render appropriate view component based on selected view ID, or placeholder when selectedView is null

## 4. Component Refactoring - ProjectsSidebar

- [x] 4.1 Update ProjectsSidebar to receive store data and actions via props or hooks
- [x] 4.2 Make project items clickable and call toggleProject on click
- [x] 4.3 Add visual indication for project expansion (expand/collapse icon)
- [x] 4.4 Add project expansion to show/hide sub-entries (views)
- [x] 4.5 Render view items under each project when expanded (explorer, diff, terminals)
- [x] 4.6 Make view items clickable and call selectView on click
- [x] 4.7 Add visual indication for selected view (highlighting)

## 5. View Components Creation

- [x] 5.1 Create ExplorerView component with placeholder UI
- [x] 5.2 Integrate ExplorerView with store's explorer state (expandedFolders, selectedFile)
- [x] 5.3 Create DiffView component with placeholder UI
- [x] 5.4 Integrate DiffView with store's diff state (leftFile, rightFile)
- [x] 5.5 Create TerminalView component with placeholder UI
- [x] 5.6 Integrate TerminalView with store's terminal state (sessionId, history)
- [x] 5.7 Add terminal label display in TerminalView header

## 6. Integration and Testing

- [x] 6.1 Update main.tsx to ensure store is available in component tree
- [x] 6.2 Verify projects load from workspace.json on application startup with expanded: false and selectedView: null
- [x] 6.3 Test project expand/collapse does not change main window
- [x] 6.4 Test view switching by clicking sub-entries (explorer, diff, terminal views)
- [x] 6.5 Test main window shows empty/placeholder when no sub-entry is selected
- [x] 6.5 Test adding multiple terminals with custom names
- [x] 6.6 Test state preservation when switching projects and views
- [x] 6.7 Run typecheck to ensure no TypeScript errors
- [x] 6.8 Run lint to ensure code quality
