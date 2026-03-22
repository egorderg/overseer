## Why

Users need to see uncommitted changes in their projects without switching to a terminal. The Diff view currently exists as a placeholder - implementing it provides immediate value for code review and understanding pending work.

## What Changes

- Implement the DiffView component to display git diff output for the selected project
- Add IPC channel for running git commands and returning structured diff data
- Parse unified diff format and render as side-by-side left/right columns
- Display all changed files in a single vertical scroll (no clicking to switch files)
- Handle modified, new (untracked), and deleted files

## Capabilities

### New Capabilities

- `git-diff-view`: Display uncommitted changes for a project with side-by-side diff visualization

### Modified Capabilities

None - this is a new capability, not modifying existing spec behavior.

## Impact

**New files:**
- `src/electron/git-diff.ts` - Git operations and diff parsing
- `src/electron/git.ts` - Git command execution utilities

**Modified files:**
- `src/shared/contracts.ts` - Add DiffResult types and getDiff to WindowApi
- `src/electron/contracts.ts` - Add GET_DIFF_CHANNEL
- `src/electron/preload.ts` - Wire up getDiff IPC
- `src/electron/main.ts` - Add IPC handler for getDiff
- `src/react/components/DiffView.tsx` - Full implementation

**Dependencies:**
- No new external dependencies - uses Node.js child_process for git commands
