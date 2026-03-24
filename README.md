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
| `npm run typecheck` | Run typechecks                    |
| `npm run lint`      | Run Biome linter                  |
| `npm test`          | Run full test suite               |

---

_For internal use only. Experimenting encouraged._
