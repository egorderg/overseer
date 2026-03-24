# Overseer

**A desktop workspace helper for managing multiple projects.**

This is an internal project built with Electron and React. Overseer helps you work across multiple repositories in one workspace, with project-focused views for explorers, terminals, and diffs.

## Dynamic Views

Overseer adapts the layout around the project you are actively working on. It keeps the most useful workspace tools close at hand, like repository explorers, terminal tabs, and git diff context, so switching between projects stays lightweight.

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

## Global Config File

Overseer now uses a single global workspace config file. Instead of managing one config per project, you define global defaults once and list all projects in the same JSON file.

- Top-level `font` controls editor and terminal typography defaults.
- Top-level `terminal` defines reusable shell presets and the default shell.
- `projects` is required and contains each workspace project.
- Each project can define explorers, diff visibility, terminals, and collapsed state.

You can validate your config against `schemas/config.schema.json`.

### Full Config Example

```json
{
  "font": {
    "family": "JetBrains Mono",
    "size": 13
  },
  "terminal": {
    "shell": "zsh-login",
    "shells": {
      "zsh-login": {
        "command": "/bin/zsh",
        "args": ["-l"],
        "env": {
          "TERM": "xterm-256color",
          "FORCE_COLOR": "1"
        }
      },
      "npm": {
        "command": "/bin/zsh",
        "args": ["-lc"],
        "env": {
          "NPM_CONFIG_COLOR": "always"
        }
      }
    }
  },
  "projects": [
    {
      "path": "/home/user/projects/overseer",
      "name": "overseer",
      "explorers": [
        {
          "name": "App",
          "path": "src",
          "ignore": ["node_modules", "dist"]
        },
        {
          "name": "Scripts",
          "path": "scripts"
        }
      ],
      "diff": {
        "enabled": true
      },
      "terminals": [
        {
          "name": "Dev Server",
          "shell": "zsh-login",
          "command": "npm run dev",
          "cwd": "."
        },
        {
          "name": "Tests",
          "shell": "npm",
          "command": "npm test",
          "cwd": "."
        },
        {
          "name": "OpenCode",
          "shell": "zsh-login",
          "command": "opencode",
          "cwd": "."
        }
      ],
      "collapsed": false
    },
    {
      "path": "/home/user/projects/client-api",
      "name": "client-api",
      "explorers": [
        {
          "name": "Service",
          "path": "src",
          "ignore": ["node_modules", "dist", "coverage"]
        }
      ],
      "diff": {
        "enabled": true
      },
      "terminals": [
        {
          "name": "API Dev",
          "shell": "npm",
          "command": "npm run dev",
          "cwd": "."
        },
        {
          "name": "Claude",
          "shell": "zsh-login",
          "command": "claude",
          "cwd": "."
        }
      ],
      "collapsed": true
    }
  ]
}
```

Notes:

- `projects[].path` must be an absolute path to an existing directory.
- `explorers[].path` and `terminals[].cwd` must be relative to `projects[].path`.
- `terminal.shell` and `projects[].terminals[].shell` must reference keys from `terminal.shells`.
- `projects[].terminals[].command` can auto-start CLIs (for example `opencode`, `claude`, or `aider`) when the terminal session starts.

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
