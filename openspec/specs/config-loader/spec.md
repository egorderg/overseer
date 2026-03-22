### Requirement: User can load a config file

The system SHALL provide a "Load Config" button in the empty state that opens a file dialog for selecting a JSON configuration file.

#### Scenario: User loads a valid config file
- **WHEN** user clicks "Load Config" button and selects a valid JSON config file
- **THEN** system parses the config and displays all defined projects

#### Scenario: User cancels file selection
- **WHEN** user clicks "Load Config" button but cancels the file dialog
- **THEN** system remains in empty state with no error message

### Requirement: Config must have valid structure

The system SHALL validate that the config file contains a `projects` array. Each project MUST have `path` (string) and `name` (string) fields.

#### Scenario: Config missing projects array
- **WHEN** user loads a JSON file without a `projects` array
- **THEN** system displays error: "Config must have a 'projects' array"

#### Scenario: Project missing required path field
- **WHEN** user loads a config where a project at index N is missing the `path` field
- **THEN** system displays error: "Project at index N missing required field 'path'"

#### Scenario: Project missing required name field
- **WHEN** user loads a config where a project at index N is missing the `name` field
- **THEN** system displays error: "Project at index N missing required field 'name'"

### Requirement: Project paths must exist and be directories

The system SHALL validate that each project `path` exists on the filesystem and is a directory.

#### Scenario: Project path does not exist
- **WHEN** user loads a config where a project path does not exist
- **THEN** system displays error: "Project path does not exist: <path>"

#### Scenario: Project path is a file not a directory
- **WHEN** user loads a config where a project path points to a file
- **THEN** system displays error: "Project path is not a folder: <path>"

### Requirement: Invalid JSON shows parse error

The system SHALL display a detailed error when the config file is not valid JSON.

#### Scenario: Config file has invalid JSON syntax
- **WHEN** user loads a file with invalid JSON
- **THEN** system displays error: "Failed to parse JSON: <error details>"

### Requirement: Views are optional with defaults

The system SHALL treat `explorer`, `diff`, `terminals`, and `collapsed` fields as optional with sensible defaults.

#### Scenario: Project has no view configuration
- **WHEN** user loads a config where a project has no `explorer`, `diff`, `terminals`, or `collapsed` fields
- **THEN** system renders the project with `explorer` and `diff` enabled, no terminals, and `collapsed` set to false

#### Scenario: Project disables explorer view
- **WHEN** user loads a config where a project has `"explorer": { "enabled": false }`
- **THEN** system does not show the explorer view for that project

#### Scenario: Project disables diff view
- **WHEN** user loads a config where a project has `"diff": { "enabled": false }`
- **THEN** system does not show the diff view for that project

#### Scenario: Project defines terminals
- **WHEN** user loads a config where a project has `"terminals": [{ "name": "Build" }]`
- **THEN** system shows a terminal view with label "Build" for that project

#### Scenario: Project starts collapsed
- **WHEN** user loads a config where a project has `"collapsed": true`
- **THEN** system renders the project sidebar item in collapsed state

### Requirement: Loading config replaces current state

The system SHALL replace all current projects when loading a new config file.

#### Scenario: User loads config while projects are displayed
- **WHEN** user has projects loaded and clicks "Load Config" to load a different config
- **THEN** system clears all existing projects and displays only projects from the new config
