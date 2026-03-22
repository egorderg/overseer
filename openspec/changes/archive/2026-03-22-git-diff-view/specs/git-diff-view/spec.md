## ADDED Requirements

### Requirement: Display uncommitted changes for selected project
The system SHALL display all uncommitted changes for the currently selected project in the Diff view.

#### Scenario: Project with modified files
- **WHEN** user selects a project with uncommitted modifications
- **THEN** system displays each modified file with side-by-side diff showing HEAD content (left) and working directory content (right)

#### Scenario: Project with new untracked files
- **WHEN** user selects a project with untracked files
- **THEN** system displays each new file showing empty left side and file content (right), truncated to first 30 lines

#### Scenario: Project with deleted files
- **WHEN** user selects a project with deleted files
- **THEN** system displays each deleted file showing file content (left) and empty right side, truncated to first 30 lines

#### Scenario: Project with clean working tree
- **WHEN** user selects a project with no uncommitted changes
- **THEN** system displays "Clean working tree" message with no file blocks

### Requirement: Side-by-side diff visualization
The system SHALL display each file's changes as a side-by-side comparison with HEAD content on the left and working directory content on the right.

#### Scenario: Line addition
- **WHEN** a line is added in the working directory
- **THEN** left column shows empty cell and right column shows the new line with its line number

#### Scenario: Line deletion
- **WHEN** a line is deleted from HEAD
- **THEN** left column shows the deleted line with its line number and right column shows empty cell

#### Scenario: Line modification
- **WHEN** a line is modified
- **THEN** left column shows the original line with its line number and right column shows the new line with its line number

#### Scenario: Context lines
- **WHEN** displaying changes
- **THEN** system includes 3 context lines before and after each change block

### Requirement: HEAD-based line numbering
The system SHALL use HEAD-based line numbers for both columns.

#### Scenario: Context line numbering
- **WHEN** displaying context lines
- **THEN** both columns show the same line number (matching HEAD)

#### Scenario: Added line numbering
- **WHEN** displaying an added line
- **THEN** left column has no line number and right column has no line number

#### Scenario: Deleted line numbering
- **WHEN** displaying a deleted line
- **THEN** left column shows the HEAD line number and right column has no line number

### Requirement: Single vertical scroll for all files
The system SHALL display all changed files in a single vertically scrollable container.

#### Scenario: Multiple files changed
- **WHEN** multiple files have uncommitted changes
- **THEN** system displays all file diffs stacked vertically in one scrollable container

#### Scenario: File header visibility
- **WHEN** displaying each file
- **THEN** system shows a header with the file path and change statistics (e.g., "+5, -2" or "NEW" or "DELETED")

### Requirement: Handle non-git scenarios gracefully
The system SHALL display appropriate messages when git operations cannot be performed.

#### Scenario: Not a git repository
- **WHEN** selected project folder is not a git repository
- **THEN** system displays "Not a git repository" message

#### Scenario: Git not installed
- **WHEN** git command fails due to git not being installed
- **THEN** system displays "Git not found" message
