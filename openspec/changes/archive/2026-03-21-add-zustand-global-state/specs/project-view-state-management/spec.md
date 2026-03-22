## ADDED Requirements

### Requirement: Store maintains project registry and expand/collapse state
The system SHALL maintain a registry of all loaded projects and track which projects are expanded in the sidebar. Each project SHALL be identified by its filesystem path and SHALL include metadata (name), expand state, view configuration (available views, selected view, view states). Projects SHALL be initialized from the workspace configuration on application startup using the existing IPC method.

#### Scenario: Projects are loaded from workspace on startup
- **WHEN** the application starts and the store initializes
- **THEN** the system loads all projects from `window.overseer.getWorkspaceProjects()`
- **AND** creates a project state entry for each project with explorer, diff, and an empty terminal registry
- **AND** initializes view states for explorer and diff views eagerly
- **AND** sets `expanded` to false for all projects (collapsed by default)
- **AND** sets `selectedView` to null for all projects (no view selected)

#### Scenario: User clicks on a project in sidebar
- **WHEN** a user clicks on a project item in the sidebar
- **THEN** the system toggles the project's `expanded` state
- **AND** the sidebar shows or hides the project's sub-entries based on the new expanded state
- **AND** the main content area does NOT change (no view is selected)

### Requirement: Store maintains per-project view configuration and selection
Each project SHALL maintain a list of available views and track which view is currently active. Views SHALL include hardcoded views (explorer, diff) and dynamic terminal views. The system SHALL support switching between views by clicking sub-entries in the sidebar. Clicking a project row only toggles expansion, never selects a view. The main window stays empty until a sub-entry is clicked.

#### Scenario: Main window is empty when no sub-entry is selected
- **WHEN** the application starts or a user has not clicked any sub-entry
- **THEN** the main content area is empty or shows a default placeholder
- **AND** no view is selected for any project

#### Scenario: User clicks Explorer sub-entry under a project
- **WHEN** a user clicks on the "Explorer" sub-entry in the sidebar for Project A
- **THEN** the system sets Project A's `selectedView` to 'explorer'
- **AND** the main content area displays the explorer view for Project A
- **AND** Project A's expanded state is not changed

#### Scenario: User switches views by clicking sub-entries
- **WHEN** a user is viewing the explorer view for Project A and clicks the "Diff" sub-entry under Project A
- **THEN** the system sets Project A's `selectedView` to 'diff'
- **AND** the main content area displays the diff view for Project A

#### Scenario: View configuration includes hardcoded and dynamic views
- **WHEN** a project is loaded into the store
- **THEN** the project's `views` array includes explorer and diff views with IDs 'explorer' and 'diff'
- **AND** the project's `views` array may include zero or more terminal views with unique IDs and custom labels

### Requirement: View state is preserved per project and view
The system SHALL maintain view-specific state for each project and each view within that project. View state SHALL be created eagerly when a project is loaded and SHALL persist when switching between projects or views. Each view type SHALL have its own state structure (e.g., explorer has expanded folders, diff has file paths, terminals have session data).

#### Scenario: Explorer state is preserved when switching views
- **WHEN** a user expands folders in the explorer view, then switches to the diff view, then switches back to explorer
- **THEN** the explorer view displays the same expanded folders as before the switch
- **AND** the folder expansion state is maintained in the project's view state

#### Scenario: View state is preserved when switching projects
- **WHEN** a user selects Project A and expands folders in explorer, then selects Project B, then selects Project A again
- **THEN** Project A's explorer view displays the same expanded folders as before
- **AND** Project B's explorer state is independent of Project A's

#### Scenario: Multiple view states coexist per project
- **WHEN** a project is loaded into the store
- **THEN** the project's `viewStates` object contains initialized state for explorer and diff views
- **AND** the `viewStates.terminals` object contains state for each terminal instance when terminals are added

### Requirement: Terminal views can be dynamically added with custom names
The system SHALL support creating multiple terminal instances per project with custom display names. Each terminal SHALL be assigned a unique ID, SHALL have a user-defined label, and SHALL maintain its own independent state (session ID, history). Terminals SHALL be listed in the project's views array alongside hardcoded views.

#### Scenario: User adds a terminal with custom name
- **WHEN** a user adds a terminal with the label "Production Log"
- **THEN** the system generates a unique terminal ID (e.g., "terminal-1234567890-abc123")
- **AND** creates a terminal view entry with that ID and label "Production Log"
- **AND** adds the terminal to the project's `views` array
- **AND** initializes the terminal's state in `viewStates.terminals[terminalId]`
- **AND** the terminal appears in the sidebar under the project with the label "Production Log"

#### Scenario: User adds multiple terminals with unique names
- **WHEN** a user adds a terminal with label "Debug Terminal", then adds another terminal with label "Test Output"
- **THEN** the system creates two distinct terminal views with different IDs
- **AND** both terminals appear in the sidebar with their respective labels
- **AND** each terminal maintains independent state (separate session IDs and histories)

#### Scenario: Terminal state is independent per terminal instance
- **WHEN** a user has two terminals open (Terminal A and Terminal B) and executes commands in Terminal A
- **THEN** Terminal B's session ID and history remain unchanged
- **AND** each terminal's state is stored separately in `viewStates.terminals`
