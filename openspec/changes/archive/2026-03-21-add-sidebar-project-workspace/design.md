## Context

The IDE already models work as a workspace that contains multiple folder-backed projects, but adding projects is not yet first-class in the sidebar. Users currently depend on manual configuration workflows, which are slower and error-prone. The requested change introduces a direct sidebar action that captures a folder path and persists project entries centrally in `~/.overseer/workspace.json` so state is shared across sessions.

## Goals / Non-Goals

**Goals:**
- Add a visible sidebar action to create a project from a folder path.
- Validate user input before save (existing path, non-duplicate project folder).
- Persist project entries in a single workspace source of truth at `~/.overseer/workspace.json`.
- Rehydrate sidebar projects from that file on startup.

**Non-Goals:**
- Redesigning the full sidebar information architecture.
- Implementing advanced project metadata editing (icons, tags, ordering rules beyond current defaults).
- Introducing multi-workspace switching in this change.

## Decisions

- Use `~/.overseer/workspace.json` as the canonical persisted workspace file.
  - Rationale: matches the product's central-config model and keeps workspace state independent of any single project directory.
  - Alternative considered: storing per-project metadata in each folder; rejected because it fragments source-of-truth and complicates startup hydration.
- Add an "Add Project" control directly in the sidebar and route through a folder selection prompt.
  - Rationale: keeps the primary workflow where users manage projects.
  - Alternative considered: only exposing a command-palette action; rejected because discoverability is lower for first-time users.
- Normalize and validate selected paths before persistence.
  - Rationale: avoids duplicate entries caused by relative/absolute path variation and prevents broken sidebar items.
  - Alternative considered: best-effort save without validation; rejected due to long-term data quality issues.
- Derive sidebar project display names from the folder basename while keeping the full normalized path in persisted data.
  - Rationale: keeps sidebar labels concise and readable while preserving full path fidelity for opening and uniqueness checks.
  - Alternative considered: displaying full paths in sidebar entries; rejected because labels become noisy and hard to scan.
- Update in-memory sidebar state only after successful persistence write.
  - Rationale: ensures UI reflects durable state and avoids ghost items when file writes fail.
  - Alternative considered: optimistic UI updates with rollback; rejected for unnecessary complexity in initial version.

## Risks / Trade-offs

- Path normalization may behave differently across OS path formats -> Mitigation: use platform-aware normalization and tests for Linux/macOS/Windows path cases where supported.
- Central file corruption or partial writes could block startup hydration -> Mitigation: write atomically (temp file + rename) and fall back to empty/default project list with user-visible error.
- Folder picker behavior differs between Electron runtime contexts -> Mitigation: isolate picker logic behind existing platform service boundary and integration-test the action flow.
