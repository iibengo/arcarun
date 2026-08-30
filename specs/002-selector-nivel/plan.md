# Implementation Plan: Selector de nivel predeterminado (Fácil / Intermedio / Avanzado / Élite)

**Branch**: `002-selector-nivel` | **Date**: 2026-08-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-selector-nivel/spec.md` (decisiones confirmadas por el usuario en la fase de clarificación).

## Summary

Añadir al menú (`MissionMenu.vue`), justo encima del selector de 'MARCA 10K', una sección de 4 tarjetas de nivel (FÁCIL / INTERMEDIO / AVANZADO / ÉLITE) con borde de color neón y tipografía arcade. Pulsar una tarjeta fija `time10k` al preset del nivel; el motor de ritmos existente (computed reactivo) recalcula la foto rápida al instante. Sincronización bidireccional: al afinar con las flechas, el nivel activo se resalta como el preset más cercano. El nivel se persiste en `localStorage` dentro de `UserSettings` (retrocompatible con el esquema v2).

El enfoque técnico:

1. **Dominio puro** (`app/utils/levels.ts`): constantes `LEVELS` (presets) + funciones puras `levelByKey` y `nearestLevel` (testeables con Vitest). Tipos `LevelKey`/`LevelPreset` en `types.ts`.
2. **Estado**: nuevo campo `UserSettings.levelKey` (persistido). `DEFAULT_SETTINGS.levelKey = 'intermedio'` (coincide con la marca por defecto 40:00). `SETTINGS_RANGES` queda tipado excluyendo `levelKey` (no es numérico).
3. **Persistencia**: `sanitizeSettings` valida `levelKey` contra `LEVELS`; si falta o es inválido, lo deriva con `nearestLevel(time10k)`. Sin cambio de versión del esquema.
4. **Composable**: `selectLevel(key)` en `useRunArcadeSetup` fija `levelKey` + `time10k`; `step()` sincroniza `levelKey` tras mutar `time10k`.
5. **UI**: sección de nivel en `MissionMenu.vue` con `grid-cols-4`, tarjetas `press` con borde por nivel y estado activo con glow; evento `selectLevel` cableado desde `RunArcadeConsole.vue`.

## Technical Context

**Language/Version**: TypeScript 5.x estricto (`strict: true` + `noUncheckedIndexedAccess: true` en el tsconfig de Nuxt 4) · Vue 3.5 (`<script setup lang="ts">`) · Nuxt 4.5

**Primary Dependencies**: Sin cambios. Se usa la infraestructura existente (Tailwind v4 vía `@tailwindcss/vite`, Vitest). **Ninguna dependencia nueva.**

**Storage**: `localStorage` clave `runArcadeState`, esquema `{ version: 2, settings, customMissions }`. `levelKey` se añade a `settings` de forma aditiva; los estados v2 antiguos (sin el campo) siguen cargando (derivación del nivel).

**Testing**: Vitest (funciones puras). Nuevo `tests/unit/levels.test.ts`; ampliación de `tests/unit/persistence.test.ts` para la sanitización de `levelKey`.

**Target Platform**: Navegador (SPA autocontenida) + SSR Nuxt.

**Project Type**: Web application (frontend Nuxt 4, directorio `app/`).

**Performance Goals**: Cambio de nivel es una asignación directa a `time10k`; el recálculo reactivo de la foto rápida es el mismo que ya hace el sistema con las flechas (sin coste adicional).

**Constraints**: Cero regresión visual/funcional del resto de la app (FR-001 de la spec 001). Sin dependencias nuevas (FR-009). La lógica pura vive en `app/utils/` y es la única capa testeada por Vitest.

**Scale/Scope**: 4 presets, 1 campo de estado nuevo, 1 función nueva en el composable, 1 sección de UI nueva.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Gates aplicados (derivados de la constitution del proyecto):

- G1: Todo código nuevo en `app/` usa `<script setup lang="ts">` y TypeScript estricto.
- G2: El comportamiento observable de la app no cambia salvo la nueva feature (sin regresión en login, misiones, energía, persistencia).
- G3: Sin dependencias nuevas.
- G4: La lógica de negocio (presets y "nivel más cercano") vive en `app/utils/levels.ts` (funciones puras), no en componentes.
- G5: La persistencia sigue el patrón existente (sanitización + clamp + tolerancia a datos corruptos).

**Re-check post-diseño**: Cumplido. No hay deps nuevas; la lógica de presets es pura y testeable; la UI solo consume `LEVELS` y emite eventos; la persistencia sigue el patrón `sanitize*` existente.

## Project Structure

### Documentation (this feature)

```text
specs/002-selector-nivel/
├── spec.md              # Especificación aprobada
├── plan.md              # This file
└── tasks.md             # Descomposición en tareas (/speckit.tasks)
```

### Source Code Changes

```text
app/
├── components/
│   ├── MissionMenu.vue        # NUEVA sección de nivel (grid-cols-4) + emit selectLevel
│   └── RunArcadeConsole.vue   # Cablea @select-level="selectLevel"
├── composables/
│   └── useRunArcadeSetup.ts   # selectLevel(key) + sync de levelKey en step()
└── utils/
    ├── levels.ts              # NUEVO: LEVELS + levelByKey + nearestLevel (puras)
    ├── persistence.ts         # sanitizeLevelKey + integración en sanitizeSettings
    ├── settings.ts            # DEFAULT_SETTINGS.levelKey + SETTINGS_RANGES tipado sin levelKey
    └── types.ts               # LevelKey, LevelPreset, NumericStateKey, UserSettings.levelKey

tests/
└── unit/
    ├── levels.test.ts         # NUEVO: presets, levelByKey, nearestLevel (incl. empates)
    └── persistence.test.ts    # sanitización/derivación de levelKey
```

**Structure Decision**: Se sigue el patrón del refactor 001: dominio puro en `app/utils/` (única capa testeada), estado orquestado por composables, UI sin lógica de negocio. Los presets de nivel viven en un módulo nuevo (`levels.ts`) en lugar de `missions.ts` para mantener separadas las constantes de misiones (catálogo) de los presets de nivel (configuración del corredor).

## Complexity Tracking

> Sin violaciones de la constitution. No se requieren justificaciones de complejidad.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| —         | —          | —                                    |
