## Why

The project currently lacks a complete TypeScript workflow, which makes type safety inconsistent and slows development with avoidable runtime bugs. Adding first-class TypeScript support now improves reliability, editor tooling, and long-term maintainability as the codebase grows.

## What Changes

- Add end-to-end TypeScript support in development, build, and test workflows.
- Configure compiler settings and project structure for mixed migration (JS + TS) and future TS-first development.
- Introduce typed interfaces for core application boundaries to catch integration issues earlier.
- Ensure linting and CI validate TypeScript correctness.

## Capabilities

### New Capabilities
- `typescript-project-support`: Define requirements for writing, building, linting, and validating TypeScript code across the project.

### Modified Capabilities
- None.

## Impact

- Affected code: build scripts, lint/test scripts, configuration files, and source modules migrated or newly added as `.ts`/`.tsx`.
- Dependencies: TypeScript compiler and supporting type tooling.
- Developer workflow: stronger IDE/type diagnostics, stricter compile-time checks, and updated CI validation.
