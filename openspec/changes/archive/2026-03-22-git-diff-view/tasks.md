## 1. Shared Types

- [x] 1.1 Add DiffLine, Hunk, DiffFile, DiffResult types to `src/shared/contracts.ts`
- [x] 1.2 Add getDiff method to WindowApi interface in `src/shared/contracts.ts`

## 2. Electron IPC Layer

- [x] 2.1 Add GET_DIFF_CHANNEL to `src/electron/contracts.ts`
- [x] 2.2 Create `src/electron/git.ts` with runGitCommand utility function
- [x] 2.3 Create `src/electron/git-diff.ts` with parseUnifiedDiff function
- [x] 2.4 Add getUntrackedFiles function to `src/electron/git-diff.ts`
- [x] 2.5 Add getDiff function to `src/electron/git-diff.ts` that combines modified/deleted/new files
- [x] 2.6 Add IPC handler in `src/electron/main.ts` for GET_DIFF_CHANNEL
- [x] 2.7 Wire up getDiff in `src/electron/preload.ts`

## 3. React DiffView Component

- [x] 3.1 Add DiffView state types to store if needed
- [x] 3.2 Implement DiffView component to fetch diff via IPC on mount
- [x] 3.3 Create file header component showing path and change stats
- [x] 3.4 Create side-by-side diff block component for single file
- [x] 3.5 Create diff line component with proper styling for add/delete/context
- [x] 3.6 Add loading and error states (not git repo, git not found)
- [x] 3.7 Add empty state for clean working tree

## 4. Styling

- [x] 4.1 Add Tailwind classes for diff visualization (added lines, deleted lines, context)
- [x] 4.2 Style file headers with path and change statistics
- [x] 4.3 Ensure proper scrolling behavior for the vertical file list

## 5. Testing

- [x] 5.1 Run typecheck to verify all types are correct
- [x] 5.2 Run lint to verify code style
- [ ] 5.3 Manual test with modified files
- [ ] 5.4 Manual test with new untracked files
- [ ] 5.5 Manual test with deleted files
- [ ] 5.6 Manual test with clean working tree
- [ ] 5.7 Manual test with non-git folder
