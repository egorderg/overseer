## 1. Tooling and Configuration Foundation

- [x] 1.1 Add TypeScript and required type packages to project dependencies
- [x] 1.2 Create base `tsconfig` and target-specific config extensions for React, Node.js, and Electron contexts
- [x] 1.3 Update build and dev scripts to recognize `.ts`/`.tsx` sources in incremental migration mode

## 2. Quality Gates and CI Integration

- [x] 2.1 Add a dedicated `typecheck` script for local validation
- [x] 2.2 Integrate TypeScript validation into CI and fail builds on unresolved type errors
- [x] 2.3 Document minimum typing/linting conventions used to keep checks consistent across modules

## 3. Typed Boundary Adoption

- [x] 3.1 Identify high-risk boundaries (API payloads, IPC channels, shared configuration objects)
- [x] 3.2 Introduce explicit TypeScript contracts for prioritized boundaries and wire producers/consumers to them
- [x] 3.3 Verify runtime parity and resolve type mismatches uncovered during boundary migration

## 4. Incremental Migration Execution

- [x] 4.1 Convert a first wave of modules to TypeScript in each major area (React, Node.js, Electron)
- [x] 4.2 Track and reduce temporary migration exceptions or suppressions
- [x] 4.3 Define next strictness phase criteria and backlog follow-up tasks for broader migration
