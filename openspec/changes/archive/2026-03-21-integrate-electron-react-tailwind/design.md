## Context

The project currently runs a React client in a browser-oriented development flow. The change introduces a desktop runtime using Electron while also adding Tailwind CSS as the primary utility styling layer. This affects startup orchestration, packaging boundaries between renderer and main processes, and CSS build tooling.

## Goals / Non-Goals

**Goals:**
- Run the existing React UI inside an Electron `BrowserWindow` for local development and packaged builds.
- Keep a single React codebase usable in both browser and Electron contexts.
- Add Tailwind CSS with PostCSS so utility classes compile consistently in development and production.
- Minimize disruption to existing scripts by extending, not replacing, current build and run workflows.

**Non-Goals:**
- Redesigning the UI or migrating all existing styles to Tailwind in this change.
- Introducing native OS integrations beyond loading and displaying the app.
- Replacing the current React build toolchain with a different framework.

## Decisions

- Use Electron main and preload entry points in a dedicated desktop folder, while keeping React as renderer code.
  - Rationale: clear process separation aligns with Electron security expectations and avoids coupling desktop code to UI components.
  - Alternative considered: embedding Electron bootstrap inside existing React source tree. Rejected to avoid mixed concerns and unclear packaging boundaries.
- Use URL loading in dev (React dev server) and file loading in production (built assets).
  - Rationale: preserves fast reload during development and supports offline packaged execution.
  - Alternative considered: always loading file-based assets. Rejected because it slows iteration and complicates HMR.
- Add Tailwind via standard `tailwindcss` + `postcss` + `autoprefixer` pipeline and a root stylesheet that includes Tailwind directives.
  - Rationale: conventional setup works with most React build tools, lowers maintenance cost, and keeps team familiarity high.
  - Alternative considered: runtime CSS-in-JS utility libraries. Rejected because they do not provide equivalent static utility generation and ecosystem compatibility.
- Add explicit npm scripts for Electron development and build orchestration.
  - Rationale: predictable entry points make onboarding and CI execution straightforward.
  - Alternative considered: manual multi-terminal startup instructions. Rejected due to operational fragility.

## Risks / Trade-offs

- Electron main process lifecycle complexity can cause dev startup race conditions with the React server. -> Mitigation: gate Electron startup behind a renderer-ready check or retry logic.
- Expanding dependency footprint increases install size and maintenance overhead. -> Mitigation: pin major versions and document upgrade cadence.
- Tailwind utility classes may coexist with legacy styles and create precedence conflicts. -> Mitigation: define Tailwind layer order and add targeted regression checks for core screens.
- Desktop packaging introduces platform-specific differences. -> Mitigation: validate builds on target operating systems in CI or release checklist.
