## Why

The current React app runs only in a browser context and lacks a standardized utility-first styling system. We need a desktop runtime and a consistent styling foundation now so upcoming product work can target packaged desktop delivery with faster UI iteration.

## What Changes

- Add an Electron host process that boots and loads the React application in a desktop window for local development and packaging.
- Wire project scripts and build flow so React assets are available to Electron in both dev and production modes.
- Add Tailwind CSS to the React frontend, including configuration, PostCSS integration, and initial stylesheet setup.
- Ensure existing UI continues to render correctly after Tailwind integration and that both browser and Electron development paths remain usable.

## Capabilities

### New Capabilities
- `electron-react-shell`: Run the existing React application inside an Electron desktop shell with a working dev and packaged startup path.
- `tailwind-styling-pipeline`: Provide Tailwind CSS configuration and build integration so React UI can use utility classes.

### Modified Capabilities
- None.

## Impact

- Affected code: frontend build configuration, app entry points, Electron main/preload process files, npm scripts.
- Dependencies: Electron, Tailwind CSS, PostCSS, and Autoprefixer.
- Systems: local development workflow, desktop packaging/runtime flow, frontend styling pipeline.
