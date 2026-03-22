## 1. Schema and Types

- [x] 1.1 Add config schema types to `src/shared/contracts.ts` (`ConfigProject`, `ConfigFile`, `LoadConfigResult`)
- [x] 1.2 Add `WindowApi` method type for `loadConfig`

## 2. IPC Channel

- [x] 2.1 Add `loadConfig` channel to `src/electron/contracts.ts`
- [x] 2.2 Add `loadConfig` handler in `src/electron/preload.ts`
- [x] 2.3 Add `loadConfig` IPC handler in `src/electron/main.ts`

## 3. Config Validation

- [x] 3.1 Create `src/electron/config-loader.ts` with `loadAndValidateConfig` function
- [x] 3.2 Implement JSON parsing with error handling
- [x] 3.3 Implement structure validation (projects array, required fields)
- [x] 3.4 Implement path validation (exists, is directory)

## 4. Store Updates

- [x] 4.1 Add `loadConfig` action to `src/react/store/store.ts`
- [x] 4.2 Add `loadConfig` selector to `src/react/store/selectors.ts`
- [x] 4.3 Update `loadProjects` to handle config project format with view defaults

## 5. UI Components

- [x] 5.1 Create `src/react/components/EmptyState.tsx` with "Load Config" button
- [x] 5.2 Add error message display to EmptyState component
- [x] 5.3 Update `src/react/App.tsx` to show EmptyState when no projects
- [x] 5.4 Add `handleLoadConfig` function in App.tsx that calls IPC and updates store
- [x] 6.1 Remove auto-load of workspace projects on startup in App.tsx
