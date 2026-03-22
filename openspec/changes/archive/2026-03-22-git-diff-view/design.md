## Context

The DiffView component is a placeholder that needs implementation. The app already has:
- IPC architecture between Electron main and React renderer
- Zustand store with project management
- Sidebar navigation to select projects and views

The diff view needs to integrate into this existing architecture, adding git command execution on the Electron side and rendering the results in React.

## Goals / Non-Goals

**Goals:**
- Display uncommitted changes (modified, new, deleted files) for selected project
- Side-by-side left/right diff visualization
- Single vertical scroll through all file diffs
- Use HEAD-based line numbers (Option 1 from exploration)
- 3 context lines around changes
- Truncate new/deleted files to first 30 lines

**Non-Goals:**
- Branch comparison (future enhancement)
- Commit history browsing
- Staging/unstaging changes (future enhancement)
- External git libraries (simple-git, etc.) - use child_process directly
- Synced horizontal scroll between left/right columns

## Decisions

### D1: Git command execution via child_process
**Decision:** Use Node.js `child_process.exec` to run git commands directly.

**Alternatives considered:**
- `simple-git` library: Adds dependency, overkill for current needs
- `isomorphic-git`: Pure JS implementation, but complex setup for Electron

**Rationale:** No external dependencies, easy to debug (run same commands in terminal), sufficient for our use case.

### D2: Parse unified diff format manually
**Decision:** Write a parser for `git diff` unified format output.

**Rationale:** The format is well-documented and stable. No need for a diff parsing library. Parser will extract:
- File headers (path, status)
- Hunk headers (@@ -start,count +start,count @@)
- Line types (context/add/delete)

### D3: Combine git diff and git ls-files for full picture
**Decision:** Run two commands:
1. `git diff HEAD --unified=3 --no-color` - modified and deleted files
2. `git ls-files --others --exclude-standard` - untracked (new) files

**Rationale:** `git diff HEAD` doesn't show untracked files. We need both for complete view.

### D4: Line numbers based on HEAD
**Decision:** Use HEAD line numbers on both sides for consistency.

**Rationale:** When lines are added, left side shows no number (empty). When lines are deleted, right side shows no number (empty). This keeps alignment intuitive.

### D5: Single vertical scroll, stacked file blocks
**Decision:** All file diffs rendered in sequence, one below another, in a single scrollable container.

**Rationale:** User can see all changes without clicking. Scanning is easier. Matches the mental model of "reviewing all my changes."

## Risks / Trade-offs

**Large diffs impact performance** → Consider lazy rendering or virtual scrolling for files with many hunks (future optimization, not in scope)

**Binary files** → Show placeholder message "(binary file)" instead of attempting to render

**Git not installed or not a git repo** → Show error message: "Not a git repository" or "Git not found"

**Encoding issues** → Assume UTF-8 for now; non-UTF-8 files may show garbled content (acceptable for v1)
