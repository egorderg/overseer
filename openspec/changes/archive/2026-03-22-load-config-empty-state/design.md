## Context

Currently, the app auto-creates and auto-loads `~/.overseer/workspace.json` on startup via a `useEffect` in `App.tsx`. The workspace file stores only project paths and names—view state is ephemeral (lost on restart).

The new model inverts this: users own their config file, choose its location, and the app becomes a passive viewer. This change introduces the "Load Config" flow while leaving the existing workspace persistence in place (removal is a separate iteration).

## Goals / Non-Goals

**Goals:**
- Add IPC channel for opening file dialog and reading/validating a config file
- Define config schema types in shared contracts
- Create empty state UI with "Load Config" button
- Display detailed validation errors in the empty state
- Update store to receive projects from loaded config

**Non-Goals:**
- Removing existing workspace persistence (separate iteration)
- Hot reload when config file changes
- Saving/writing config from the app
- Migrating existing workspace.json to new format

## Decisions

### 1. Validation location: Electron main process

Validation happens in the main process because:
- Has direct file system access via Node.js
- Can resolve and check paths without IPC round-trips
- Consistent with existing pattern (`addWorkspaceProject` validates in main)

**Alternative considered:** Validate in renderer
- Would require exposing file system APIs or multiple IPC calls
- More complex, less secure

### 2. Error result type: Structured result

Use a result type similar to existing `AddWorkspaceProjectResult`:

```typescript
type LoadConfigResult =
  | { ok: true; config: ConfigFile }
  | { ok: false; error: string }
```

The error string contains the detailed message (e.g., "Project at index 2 missing required field 'path'").

### 3. Config schema: New types in shared/contracts.ts

```typescript
interface ConfigProject {
  path: string;
  name: string;
  explorer?: { enabled?: boolean };
  diff?: { enabled?: boolean };
  terminals?: { name: string }[];
  collapsed?: boolean;
}

interface ConfigFile {
  projects: ConfigProject[];
}
```

### 4. Empty state component placement

Create a new `EmptyState.tsx` component that:
- Centers "Load Config" button in the main content area
- Displays error messages below the button
- Renders when `projects` in store is empty

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Large config files could slow validation | Acceptable for typical use; can add limits later |
| Many projects with slow path checks | Validate sequentially, show progress if needed |
| User confusion about file format | Clear error messages; consider docs/example later |
