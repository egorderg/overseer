# Electron + React + Tailwind workflow

## Commands

- `npm run dev`: starts the Vite React dev server and launches Electron against `http://localhost:5173`.
- `npm run build`: compiles Electron/Node/renderer TypeScript and builds the React bundle into `dist/react`.
- `npm run start:electron`: launches Electron in production mode and loads `dist/react/index.html`.
- `npm run test`: runs type checks and preload bridge smoke checks.

## Notes

- Electron resolves renderer source from `ELECTRON_RENDERER_URL` in development, otherwise it loads `dist/react/index.html`.
- Tailwind is configured through `tailwind.config.cjs` and `postcss.config.cjs`; styles are imported from `src/react/styles.css`.

## Packaging follow-ups

- Validate desktop build behavior on macOS and Windows release targets before enabling installers.
- Confirm GPU/rendering behavior on CI and headless Linux environments to prevent environment-specific launch failures.
