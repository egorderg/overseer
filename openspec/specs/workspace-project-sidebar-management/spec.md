## Requirements

### Requirement: Sidebar supports adding projects from folders
The application MUST provide an "Add Project" action in the sidebar that allows a user to choose a local folder and create a new project entry. The sidebar item name MUST be the selected folder's basename and MUST NOT display the full path as the primary label.

#### Scenario: User adds a project from the sidebar
- **WHEN** the user clicks the sidebar "Add Project" action and selects a valid folder
- **THEN** the system creates a project entry for that folder and displays it as an item in the sidebar

#### Scenario: Sidebar label uses folder basename
- **WHEN** the user adds a folder located at `/dev/apps/overseer`
- **THEN** the sidebar displays the project name as `overseer` and does not use `/dev/apps/overseer` as the entry label

### Requirement: Project additions are validated before save
The application MUST validate selected project folders before persisting new entries, including checking that the path exists and that the normalized folder path is not already present in the workspace project list.

#### Scenario: Duplicate folder is rejected
- **WHEN** the user selects a folder whose normalized path already exists in the workspace project list
- **THEN** the system does not create a duplicate project entry and informs the user that the folder is already added

#### Scenario: Missing folder is rejected
- **WHEN** the user selects a folder path that does not exist
- **THEN** the system does not create a project entry and informs the user that the folder is invalid

### Requirement: Workspace projects persist in central workspace file
The application MUST persist the workspace project list in `~/.overseer/workspace.json` and load project entries from that file during application startup.

#### Scenario: Added project persists across restart
- **WHEN** a user adds a valid project folder and restarts the application
- **THEN** the project appears in the sidebar after startup hydration from `~/.overseer/workspace.json`

#### Scenario: Persist failure does not create in-memory ghost project
- **WHEN** writing `~/.overseer/workspace.json` fails during add-project flow
- **THEN** the system keeps the sidebar project list unchanged and shows an error to the user
