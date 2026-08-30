# Runcade Constitution

## Core Principles

### I. Spec-Driven Development (SDD) Mandatory
Every feature, enhancement, or fix must strictly follow the GitHub Spec Kit lifecycle: Constitution → Specify (`spec.md`) → Clarify (`clarify`) → Plan (`plan.md`) → Tasks (`tasks.md`) → Implement (`implement`) → Converge (`converge`). No premature coding without an approved specification and technical plan.

### II. Nuxt-First & Modern Vue Architecture
All frontend logic must leverage modern Nuxt and Vue 3 paradigms using the Composition API with `<script setup lang="ts">`, strict TypeScript, and standard directory conventions (`pages/`, `components/`, `composables/`, `server/`, `layouts/`). Avoid anti-patterns or bloated global states where simple composables or Nuxt data-fetching utilities (`useFetch`, `useAsyncData`) suffice.

### III. Test-First & Quality Assurance (Vitest)
TDD is strictly enforced for critical business logic and composables. Tests must be written and verified using **Vitest** alongside the project's testing utilities. The Red-Green-Refactor cycle applies to all feature implementations.

### IV. Styling via Tailwind CSS
All UI components and layouts must use utility-first styling via **Tailwind CSS**, adhering to design consistency, responsiveness, and accessibility standards without introducing arbitrary custom CSS unless strictly required.

### V. Strict Dependency Management & Simplicity
**npm** is the exclusive package manager for all script executions, package additions, and dependency resolutions. Adhere strictly to YAGNI (You Aren't Gonna Need It) and KISS principles, keeping the codebase clean, modular, and performant.

## Additional Constraints

### Technical Stack & Ecosystem Standards
- **Framework:** Nuxt latest stable, Vue 3.
- **Language:** TypeScript with strict mode enabled (`tsconfig.json`).
- **Testing:** Vitest for unit and integration testing.
- **Package Management:** `npm` only (do not introduce `pnpm`, `yarn`, or `bun` lockfiles or commands).

## Development Workflow & Quality Gates

### Spec Kit Enforcement & Review Process
- Every Pull Request or change set must align directly with its corresponding `spec.md` and `plan.md`.
- Code changes must pass the Convergence phase (`/speckit.converge`), ensuring all tests pass, TypeScript compilation succeeds without errors, and functionality matches the initial specification.
- Complexity must be justified; changes that bypass the SDD workflow will be rejected.

## Governance

This Constitution supersedes all other ad-hoc practices or shortcuts. Amendments to this document require explicit documentation, team approval, and a corresponding migration or adaptation plan. All development actions must verify compliance with these rules at every phase of the Spec Kit workflow.

**Version**: 1.0.0 | **Ratified**: 2026-03-30 | **Last Amended**: 2026-03-30