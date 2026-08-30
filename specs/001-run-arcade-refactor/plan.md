# Implementation Plan: Refactor de RUN·ARCADE

**Branch**: `001-run-arcade-refactor` | **Date**: 2026-08-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-run-arcade-refactor/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Refactor estructural de la app RUN·ARCADE (actualmente un monolito de ~1090 líneas en `app/pages/[...slug].vue`) con **cero cambios de comportamiento observable** (excepción: cálculo de distancia en CUESTAS y robustez de persistencia, que son mejoras intencionales).

El enfoque técnico:

1. **Decomposición**: extraer el catálogo de misiones, el motor de ritmos, los formateadores y la lógica de persistencia a funciones puras en `app/utils/` (auto-importadas por Nuxt y unit-testables con Vitest), y dividir la UI en componentes Vue (`RunArcadeLogin`, `MissionMenu`, `MissionSetup`, `PlanCard`, `CreateMissionForm`, `RunArcadeConsole`). La página `[...slug].vue` queda como composición pura.
2. **Persistencia blindada**: nuevo esquema versionado `{ version, settings, customMissions }` con migración desde el formato plano legado, `try/catch` en el parseo, clamps de rangos, y fusión inteligente: el catálogo base siempre viene del código, solo se persisten las misiones personalizadas del usuario.
3. **TypeScript estricto**: el tsconfig de Nuxt ya aplica `strict: true` + `noUncheckedIndexedAccess: true`; se tipa estado (`UserSettings`), catálogo (`Mission`/`PlanBlock`), pasos (`PlanStep`) y claves de parámetros (`StateKey = keyof UserSettings`) para eliminar accesos inseguros por string.
4. **Correcciones puntuales**: distancia de CUESTAS incluye el trabajo de subida (`work_offset`), tema Tailwind unificado en un solo archivo global, ruta comodín que redirige a `/` sin ensombrecer rutas de contenido, y eliminación de componentes muertos.

## Technical Context

**Language/Version**: TypeScript 5.x (estricto, `strict: true` + `noUncheckedIndexedAccess: true` ya activos en el tsconfig de Nuxt 4) · Vue 3.5 (`<script setup lang="ts">`) · Nuxt 4.5

**Primary Dependencies**: `nuxt` (4.5.1), `vue` (3.5.40), `tailwindcss` (v4 vía `@tailwindcss/vite`), `@nuxt/content`. **Nueva dependencia de desarrollo**: `vitest` (para tests de funciones puras).

**Storage**: `localStorage` (clave `runArcadeState`), esquema versionado `{ version: 2, settings, customMissions }` con migración del formato legado plano (v1).

**Testing**: Vitest (entorno `node`, solo funciones puras de `app/utils/`). No se montan componentes en tests; los componentes se verifican vía `quickstart.md` (validación manual guiada) y build.

**Target Platform**: Navegador (SPA autocontenida) + SSR en Nuxt (login form server-rendered).

**Project Type**: Web application (frontend Nuxt 4, directorio `app/`).

**Performance Goals**: Persistencia con debounce de 400ms (sin cambios); la serialización se reduce porque ya no se persiste el catálogo completo, solo `settings` + `customMissions` (misiones personalizadas, típicamente pocas).

**Constraints**: Cero regresión visual/funcional (FR-001, SC-001). La contraseña del login permanece hardcodeada (FR-012, decisión explícita del usuario). Ruta comodín no debe ensombrecer rutas de contenido (FR-010).

**Scale/Scope**: App de una página; 9 misiones base + N personalizadas; estado de configuración reducido (~14 campos).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

La constitution actual (`app/.specify/memory/constitution.md`) es la plantilla de ejemplo sin rellenar (placeholders `[PRINCIPLE_1_NAME]`, etc.), por lo que **no impone gates adicionales** más allá de los principios del proyecto definidos en el system prompt: Nuxt conventions (estructura `app/`, `<script setup lang="ts">`), npm como package manager, Tailwind CSS, Vitest, y SDD (spec → plan → tasks → implement → converge).

**Gates aplicados** (derivados del contexto del proyecto):

- G1: Todo código nuevo en `app/` usa `<script setup lang="ts">` y TypeScript estricto.
- G2: El comportamiento observable de la app no cambia (excepto correcciones aprobadas en spec).
- G3: Sin dependencias nuevas en runtime (solo `vitest` como devDependency).
- G4: La funcionalidad de negocio vive en `app/utils/` (funciones puras), no dentro de componentes.

**Re-check post-diseño**: Cumplido. El diseño mantiene las páginas catch-all e index, no añade deps runtime, y separa lógica pura de UI.

## Project Structure

### Documentation (this feature)

```text
specs/001-run-arcade-refactor/
├── plan.md              # This file
├── research.md          # Phase 0: decisiones y alternativas
├── data-model.md        # Phase 1: entidades y validaciones
├── contracts/           # Phase 1: contratos de módulos (utils/composables/components)
├── quickstart.md        # Phase 1: guía de validación end-to-end
└── tasks.md             # Phase 2: descomposición en tareas (/speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── assets/css/
│   └── tailwind.css             # ÚNICA fuente de tema: @import tailwindcss + @theme tokens arcade (consolidado)
├── components/
│   ├── RunArcadeLogin.vue       # Login (contraseña temporal intacta)
│   ├── RunArcadeConsole.vue     # Carcasa consola: marca, pantalla, mando, overlay READY?
│   ├── MissionMenu.vue          # Estado "menu": ajuste 10K, cuadrícula de misiones, energía
│   ├── MissionSetup.vue         # Estado "setup": controles por misión + PlanCard + acciones
│   ├── PlanCard.vue             # La foto rápida: métricas, desglose de pasos, coach
│   └── CreateMissionForm.vue    # Formulario de creación/edición de misión
├── composables/
│   ├── useRunArcadeState.ts     # Estado reactivo + persistencia (carga/migración/guardado con debounce)
│   ├── useRunArcadeAuth.ts      # isAuthenticated/password/checkPassword (lógica, sin cambio de comportamiento)
│   └── useRunArcadeSetup.ts     # view/missionKey/activeMission/plan + steppers y cycles
├── pages/
│   ├── index.vue                # NUEVO: renderiza RunArcadeApp (la app en "/")
│   ├── [...slug].vue            # SLIM: redirige rutas desconocidas a "/" (no ensombrece contenido)
│   └── style.css                # ELIMINADO (tokens movidos a assets/css/tailwind.css)
└── utils/
    ├── missions.ts              # Tipos Mission/PlanBlock + catálogo MISSIONS (fila fuente de verdad)
    ├── pace.ts                  # Funciones puras: basePace, pace, buildPlan (motor de ritmos)
    ├── formatters.ts            # fmtPace, fmtDuration, fmtKm, levelLabel
    ├── persistence.ts           # STORAGE_KEY, versionado, sanitize/clamp, loadState, saveState, migración v1→v2
    └── types.ts                 # UserSettings, EnergyLevel, PlanStep, RunPlan, StateKey (tipos compartidos)

tests/
└── unit/
    ├── pace.test.ts             # Motor de ritmos + buildPlan (incl. hills #10, regresión de las 9 misiones)
    ├── formatters.test.ts       # Formateadores (límites: 4:60 imposible, duraciones, km)
    └── persistence.test.ts      # try/catch, clamps, migración v1→v2, fusión de catálogo

(Eliminados: app/components/Counter.vue, app/components/Alert.vue)
```

**Structure Decision**: Se usa el patrón estándar de Nuxt 4 con `app/` como raíz de la aplicación. `app/utils/` aloja funciones puras auto-importadas (convención Nuxt) y es la única capa testada por Vitest. `app/composables/` orquesta estado reactivo sobre las utils. `app/components/` es UI sin lógica de negocio. Este es el "single project" layout del template, adaptado a convenciones Nuxt.

## Complexity Tracking

> Sin violaciones de la constitution. No se requieren justificaciones de complejidad.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| —         | —          | —                                    |
