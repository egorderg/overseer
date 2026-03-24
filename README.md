# Overseer

**An AI-first IDE with dynamic views.**

This is an internal, fun project to play around with AI. Built with Electron and React, Overseer reimagines the traditional IDE by letting AI drive the experience.

## Dynamic Views

Rather than a fixed layout, Overseer's UI reconfigures itself contextually to keep relevant tools and information front and center. The interface adapts based on what you're working on.

## Tech Stack

- **Electron** — Desktop shell
- **React** — Renderer UI
- **TypeScript** — Strict typing throughout
- **Tailwind CSS** — Styling
- **Vite** — Build tooling
- **Biome** — Linting & formatting

## Getting Started

```bash
npm ci
npm run dev
```

## Commands

| Command             | Description                       |
| ------------------- | --------------------------------- |
| `npm run dev`       | Start React dev server + Electron |
| `npm run build`     | Full production build             |
| `npm run dist:mac`  | Build macOS `.app` bundles        |
| `npm run dist:win`  | Build Windows portable `.exe`     |
| `npm run dist:linux` | Build Linux `.AppImage`           |
| `npm run dist`      | Build bundle for current platform |
| `npm run typecheck` | Run typechecks                    |
| `npm run lint`      | Run Biome linter                  |
| `npm test`          | Run full test suite               |

## Platform Bundles

Bundles are generated in `release/` with no installer wizards:

- macOS: `.app` bundles (both `x64` and `arm64` when using `npm run dist:mac`)
- Windows: portable `.exe` (`npm run dist:win`)
- Linux: `.AppImage` binary (`npm run dist:linux`)

To produce all three platforms in one run, use the GitHub Actions `Bundle` workflow.
Pushing a tag like `v1.0.0` runs this workflow automatically and attaches the bundles to the matching GitHub release.
Each release asset is a `.zip` that includes the platform binary and `config.schema.json`.

---

_For internal use only. Experimenting encouraged._
