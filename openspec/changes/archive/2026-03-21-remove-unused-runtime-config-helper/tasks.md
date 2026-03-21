## 1. Remove unused runtime config module

- [x] 1.1 Delete `src/node/config.ts` and ensure no source imports reference it.
- [x] 1.2 Confirm Node TypeScript build output no longer includes `dist/node/config.js` artifacts after rebuild.

## 2. Preserve startup behavior and validate

- [x] 2.1 Keep `src/electron/main.ts` environment mode routing behavior unchanged while removing dead config paths.
- [x] 2.2 Run project validation (`npm run typecheck`, `npm run build`, and `npm run test`) and resolve any regressions caused by the cleanup.

## 3. Align documentation and spec intent

- [x] 3.1 Verify the `electron-react-shell` delta spec reflects active startup-path behavior after cleanup.
- [x] 3.2 Record completion notes in the change checklist and prepare the change for `/opsx-apply` execution.

## Completion Notes

- Removed `src/node/config.ts`; no source imports reference `getRuntimeConfig` or `AppRuntimeConfig`.
- Confirmed `src/electron/main.ts` startup mode routing is unchanged.
- Rebuilt Node target; no `dist/node/config.js` artifact is emitted.
- Validation passed: `npm run typecheck`, `npm run build`, and `npm run test`.
