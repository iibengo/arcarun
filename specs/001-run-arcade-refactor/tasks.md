---

description: "Task list for RUN·ARCADE refactor"

---

# Tasks: Refactor de RUN·ARCADE

**Input**: Design documents from `/specs/001-run-arcade-refactor/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests de funciones puras requeridos por el spec (Assumptions + SC-004). Se escriben PRIMERO (TDD) y deben fallar antes de la implementación.

**Organization**: Tasks grouped by user story. US1 y US3 comparten la descomposición del monolito; se ejecutan en fases separadas para permitir validación independiente.

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

- Single project Nuxt 4: `app/` + `tests/` en la raíz del repo.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicializar el tooling de test y scripts.

- [x] T001 Añadir `vitest` como devDependency: `npm install -D vitest`
- [x] T002 Crear `vitest.config.ts` en la raíz con `test.environment = 'node'` e `include: ['tests/**/*.test.ts']`
- [x] T003 Añadir script `"test": "vitest run"` en `package.json`
- [x] T004 Crear directorio `tests/unit/` (con `.gitkeep` si está vacío)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tipos compartidos de los que dependen TODAS las historias.

**⚠️ CRITICAL**: Ninguna user story puede comenzar hasta completar esta fase.

- [x] T005 Crear `app/utils/types.ts` con todos los tipos compartidos (UserSettings, EnergyLevel, PaceKey, BlockType, PlanBlock unión discriminada, PlanConfig, Mission, PlanStep, RunPlan, PersistedStateV2, StateKey = keyof UserSettings)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - La consola sigue funcionando idéntica tras el refactor (Priority: P1) 🎯 MVP

**Goal**: Descomponer el monolito `app/pages/[...slug].vue` en utils puras, composables y componentes, sin cambiar ningún comportamiento observable.

**Independent Test**: Recorrer el flujo completo (login → menú → cada una de las 9 misiones → foto rápida → crear/borrar misión personalizada → energía) y verificar que las pantallas y números son idénticos al estado pre-refactor.

### Tests for User Story 1 (TDD) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T006 [P] [US1] Crear `tests/unit/formatters.test.ts` con casos límite: `fmtPace(240)` → `'4:00'`, sin `'4:60'`; `fmtDuration(1200)` → `'20 min'`, `fmtDuration(4500)` → `'1h 15m'`; `fmtKm(8)` → `'8.0 km'`; `levelLabel(2400)` → `'10K · 4:00/km'`
- [x] T007 [P] [US1] Crear `tests/unit/pace.test.ts` con valores de referencia: `basePaceSec(2400)` → `240`; `pace()` con offsets y energía; `buildPlan` para las 9 misiones (serie de números esperados basada en el comportamiento actual)

### Implementation for User Story 1

- [x] T008 [P] [US1] Crear `app/utils/formatters.ts` con funciones puras `fmtPace`, `fmtDuration`, `fmtKm`, `levelLabel` (misma lógica que el monolito)
- [x] T009 [P] [US1] Crear `app/utils/missions.ts` con catálogo `MISSIONS` (9 misiones), `ENERGY_LEVELS`, `PREDEFINED_COLORS` y constantes `STORAGE_KEY`/`STORAGE_VERSION` (movidos del monolito, tipados con los tipos de `types.ts`)
- [x] T010 [P] [US1] Crear `app/utils/pace.ts` con motor de ritmos puro: `OFFSETS`, `basePaceSec`, `pace`, `energyFromIndex`, `buildPlan(mission, settings)` (misma lógica que el monolito, tipada; incluye todos los blockProcessors: warmup/cooldown/run/interval/progressive/hills/pyramid/extra)
- [x] T011 [US1] Crear `app/composables/useRunArcadeAuth.ts` (isAuthenticated/password/errorMessage/checkPassword — lógica de contraseña INTACTA, parche temporal FR-012)
- [x] T012 [US1] Crear `app/composables/useRunArcadeState.ts` con estado reactivo tipado, `customMissions`, `catalog` (fusión `[...MISSIONS, ...customMissions]`) y API `addCustomMission`/`deleteCustomMission` (persistencia se integra en US2; aquí solo estado y carga inicial segura con defaults)
- [x] T013 [US1] Crear `app/composables/useRunArcadeSetup.ts` con `view`, `missionKey`, `activeMission`, `newMissionData`, `plan` (via `buildPlan`), `energy`, steppers genéricos, `cycleFromList`, `selectMission`, `backToMenu`, `showCreateForm`, `saveNewMission`, `shiftEnergy`, `stepBaseTime`, `launch`
- [x] T014 [P] [US1] Crear `app/components/RunArcadeLogin.vue` (template del form de login movido del monolito; emit `success`)
- [x] T015 [P] [US1] Crear `app/components/MissionMenu.vue` (ajuste 10K, cuadrícula de misiones, control de energía, botón "+")
- [x] T016 [P] [US1] Crear `app/components/PlanCard.vue` (tarjeta de foto rápida: métricas, desglose de pasos, coach)
- [x] T017 [P] [US1] Crear `app/components/MissionSetup.vue` (controles por misión + PlanCard + acciones, incluye steppers y cycles por misión)
- [x] T018 [P] [US1] Crear `app/components/CreateMissionForm.vue` (formulario de creación/edición con editor de bloques)
- [x] T019 [US1] Crear `app/components/RunArcadeConsole.vue` (carcasa CRT: marca, pantalla, overlay READY?, mando decorativo; compone los componentes de las vistas)
- [x] T020 [US1] Reescribir `app/pages/index.vue` (nuevo): renderiza `RunArcadeConsole` en `/` (composición pura, sin lógica)
- [x] T021 [US1] Reescribir `app/pages/[...slug].vue` (slim): redirige rutas desconocidas a `/` (navigateTo en setup o `definePageMeta` con redirect), sin lógica de negocio
- [x] T022 [US1] Eliminar `import "./style.css"` de `app/pages/[...slug].vue` (el CSS se consolida en US5)

**Checkpoint**: US1 completa y validable con V-001/V-004 de quickstart.md. Ejecutar `npx nuxi typecheck` y `npm test`.

---

## Phase 4: User Story 2 - La persistencia nunca rompe la app (Priority: P1)

**Goal**: Carga segura, clamps de rangos, migración v1→v2 y fusión de catálogo sin congelar misiones futuras.

**Independent Test**: Inyectar en `localStorage['runArcadeState']` JSON corrupto, `null`, valores fuera de rango y formato v1; en todos los casos la app carga al menú sin errores y con valores saneados (V-002).

### Tests for User Story 2 (TDD) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T023 [US2] Crear `tests/unit/persistence.test.ts` cubriendo: `parsePersisted` con string corrupto → defaults sin lanzar; `null` → defaults; `energyIndex: 99` → clamp a 2; `time10k: 99` → clamp a 1800; formato v1 plano con `missions[]` → migra a v2 extrayendo solo `custom_*`; `serializePersisted` round-trip

### Implementation for User Story 2

- [x] T024 [P] [US2] Crear `app/utils/persistence.ts` con `clamp`, `sanitizeSettings(raw: unknown)`, `sanitizeMissions(raw: unknown)`, `parsePersisted(raw)` (try/catch + detección v1 + migración), `serializePersisted`, `mergeCatalog` (dedupe por key)
- [x] T025 [US2] Integrar persistencia en `app/composables/useRunArcadeState.ts`: `onMounted` → `parsePersisted` + `Object.assign(state, settings)` + `customMissions = sanitized`; `watch([state, customMissions], debounced saveState, { deep: true })` con debounce 400ms y guard `import.meta.client`
- [x] T026 [US2] Verificar en `useRunArcadeState.ts` que el `watch` inicial no escribe de vuelta datos idénticos de forma redundante (opcional: flag `hasLoaded`)

**Checkpoint**: US2 completa y validable con V-002 de quickstart.md. Ejecutar `npm test`.

---

## Phase 5: User Story 3 - La base de código es mantenible y tipada (Priority: P2)

**Goal**: Garantizar TypeScript estricto en todo el código, sin accesos inseguros a claves de estado.

**Independent Test**: `npx nuxi typecheck` sin errores; el archivo `[...slug].vue` no contiene catálogo ni motor; los accesos a `state[param]` usan `StateKey` tipado (V-004).

### Implementation for User Story 3

- [x] T027 [US3] Asegurar que todos los archivos nuevos usan `<script setup lang="ts">` y que `buildPlan`/composables acceden a parámetros de bloque vía `StateKey` tipado (`state[params.reps]` etc., sin `as any`)
- [x] T028 [US3] Ejecutar `npx nuxi typecheck` y corregir TODOS los errores de tipos (incluidos `noUncheckedIndexedAccess` en accesos a arrays/listas de misiones)
- [x] T029 [US3] Eliminar código muerto detectado: `removeBlockFromCustomMission` ya no existe en el formulario (se usa el método del composable o del componente según corresponda), sin funciones sin usar

**Checkpoint**: US3 completa y validable con V-004 de quickstart.md.

---

## Phase 6: User Story 4 - La tirada de cuestas estima la distancia completa (Priority: P2)

**Goal**: Corregir el cálculo de distancia de CUESTAS para incluir el trabajo de subida.

**Independent Test**: Con 10K fijo y energía NORMAL, CUESTAS 8 reps × 60s rec ×2 → la distancia total incluye subida + recuperación y es coherente con el tiempo (V-003).

### Tests for User Story 4 (TDD) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T030 [US4] Añadir a `tests/unit/pace.test.ts` un caso para el bloque `hills`: con settings fijos, verificar que `totalKm` incluye trabajo + recuperación (mayor que el valor previo que solo contaba la bajada) y que `totalSec`/`km` son coherentes; probar reps min/max y energía fresco/cansado sin NaN ni valores negativos

### Implementation for User Story 4

- [x] T031 [US4] Modificar en `app/utils/pace.ts` el blockProcessor `hills` de `buildPlan`: añadir `work_pace` (base + `work_offset` del bloque, p. ej. +20s/km, aplicando `energy.mult`) y calcular `km = total_work_s / work_pace + total_rec_s / rec_pace`
- [x] T032 [US4] Añadir `work_offset` al bloque `hills` de `MISSIONS` en `app/utils/missions.ts` (p. ej. 20) y actualizar `metaTemplate` si es necesario

**Checkpoint**: US4 completa y validable con V-003 de quickstart.md. Ejecutar `npm test`.

---

## Phase 7: User Story 5 - Base visual y de rutas limpia (Priority: P3)

**Goal**: Única fuente de verdad para el tema Tailwind, componentes de andamiaje eliminados y ruta comodín sin ensombrecer contenido.

**Independent Test**: `@import "tailwindcss"` y `@theme` aparecen una sola vez; no existen `Counter.vue`/`Alert.vue`; `/about` no es capturada por la app (V-005, V-006).

### Implementation for User Story 5

- [x] T033 [US5] Consolidar el tema: mover los tokens `@theme` arcade (oled/panel/neones/fuentes) y estilos base (`.crt`, `.blink`, `.press`, `@font-face`, `html/body/#app`) de `app/pages/style.css` a `app/assets/css/tailwind.css` (cargado globalmente en `nuxt.config.ts`)
- [x] T034 [US5] Eliminar `app/pages/style.css` (ya sin imports desde la página tras T022)
- [x] T035 [US5] Eliminar componentes de andamiaje `app/components/Counter.vue` y `app/components/Alert.vue`
- [x] T036 [US5] Verificar que `content/index.md` y `content/about.md` (referencian los componentes eliminados) no se renderizan ni rompen la app; si el contenido del starter no se usa, documentar en README que es andamiaje de Nuxt Content (o eliminarlo si el usuario lo aprueba en la fase de implementación)

**Checkpoint**: US5 completa y validable con V-005/V-006 de quickstart.md.

---

## Phase 8: User Story 6 - La consola es instalable y funciona offline (PWA) (Priority: P1)

**Goal**: Convertir RUN·ARCADE en una PWA instalable con `@vite-pwa/nuxt`: manifest arcade completo, orientación vertical + standalone, Service Worker con soporte offline básico, y despliegue compatible con Vercel.

**Independent Test**: En el móvil (o DevTools con dispositivo simulado), tras una visita con conexión: instalar la app desde el menú del navegador → aparece el icono de RUN·ARCADE; poner el dispositivo en modo avión → abrir la app instalada → funciona todo el flujo core (login → menú → foto rápida) offline.

### Implementation for User Story 6

- [x] T042 [P] [US6] Instalar el módulo PWA: `npm install @vite-pwa/nuxt`
- [x] T043 [US6] Configurar el módulo en `nuxt.config.ts`: añadir `'@vite-pwa/nuxt'` a `modules` y bloquee `pwa` con `registerType: 'autoUpdate'`, `devOptions: { enabled: false }` (no SW en dev) y `workbox` con `globPatterns` para js/css/html/png/svg/woff2, `cleanupOutdatedCaches: true` y `navigateFallback: '/'`
- [x] T044 [P] [US6] Crear el manifest en la config `pwa.manifest` de `nuxt.config.ts`: `name: 'RUN·ARCADE'`, `short_name: 'RUN·ARCADE'`, `description`, `theme_color: '#050608'` (OLED), `background_color: '#050608'`, `display: 'standalone'`, `orientation: 'portrait'`, `lang: 'es'`, `start_url: '/'` e `icons` referenciando los PNG de `public/`
- [x] T045 [US6] Crear los iconos de la app en `public/` (p. ej. `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` y `apple-touch-icon.png`) con el diseño de la consola arcade (fondo OLED + acento neón verde `#39ff88`); si no hay herramienta de diseño, generar un SVG fuente y exportarlo a los tamaños requeridos (o añadir `@vite-pwa/assets-generator` como devDependency para generarlos desde un SVG)
- [x] T046 [US6] Verificar que el SW se registra en producción: tras `npm run build`, comprobar que `.output/public/sw.js`, `.output/public/manifest.webmanifest` (o el nombre configurado) y los iconos existen y se sirven en la raíz
- [x] T047 [US6] Validar el despliegue en Vercel: comprobar que el manifest y el SW se sirven en la raíz del dominio de producción (curl `https://<dominio>/manifest.webmanifest` y `https://<dominio>/sw.js`) y que la instalación/offline funcionan sin configuración de servidor adicional
- [x] T048 [US6] Validar el flujo offline en móvil/DevTools: primera visita online → modo avión → abrir la app instalada → verificar login, menú, ajustes y foto rápida funcionan; probar también la ruta comodín offline (redirige al fallback `/`)
- [x] T049 [US6] Actualizar `README.md` con la sección PWA (instalación, uso offline, verificación en Vercel)

**Checkpoint**: US6 completa y validable con V-008/V-009 de quickstart.md (nuevos escenarios PWA).

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Validación final integral.

- [x] T037 Ejecutar `npm test` (todos los tests unitarios pasan)
- [x] T038 Ejecutar `npx nuxi typecheck` (cero errores de tipos)
- [x] T039 Ejecutar `npm run build` (build exitoso; revisar CSS generado sin duplicados)
- [x] T040 Ejecutar `npm run dev` y recorrer quickstart.md V-001 a V-007 (validación manual completa)
- [x] T041 Actualizar README.md si describe estructura/scripts (p. ej. añadir `npm test`)
- [x] T050 Ejecutar `npm run build` tras la integración PWA (build exitoso con SW y manifest generados)
- [x] T051 Ejecutar `npx nuxi typecheck` tras la integración PWA (cero errores; verificar tipos del manifest en nuxt.config.ts)
- [x] T052 Recorrer quickstart.md V-001 a V-009 (validación integral final, incluidos los escenarios PWA V-008/V-009)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias - puede empezar inmediatamente
- **Foundational (Phase 2)**: Depende de Phase 1 - BLOQUEA todas las user stories
- **User Stories (Phase 3+)**: Todas dependen de Phase 2
  - US1 y US2 son P1: pueden ir en paralelo (ficheros distintos), o secuenciales (US1 → US2)
  - US3 (P2) depende de US1 (verifica el tipado de la descomposición)
  - US4 (P2) depende de US1 (modifica `pace.ts`/`missions.ts` ya creados)
  - US5 (P3) depende de US1 (elimina `style.css` y componentes ya descompuestos)
  - US6 (P1) depende de US5 (se apoya en la estructura final de `app/`, el CSS consolidado y las páginas `index.vue`/`[...slug]`)
- **Polish (Phase 9)**: Depende de todas las historias deseadas completas

### User Story Dependencies

- **US1 (P1)**: Comienza tras Phase 2. Sin dependencias de otras historias (MVP).
- **US2 (P1)**: Comienza tras Phase 2. Integra `useRunArcadeState` de US1 (T012) — puede integrarse al final de su propia fase.
- **US3 (P2)**: Depende de US1 (valida tipado del código descompuesto).
- **US4 (P2)**: Depende de US1 (T010 `pace.ts`, T009 `missions.ts`).
- **US5 (P3)**: Depende de US1 (T022 elimina el import del CSS).
- **US6 (P1)**: Depende de US1/US5 (estructura final, CSS global consolidado en `assets/css/tailwind.css`, páginas `index.vue` + catch-all redirect). No toca utils/composables.

### Within Each User Story

- Tests (TDD) se escriben y fallan ANTES de la implementación
- Tipos (Phase 2) antes de utils → utils antes de composables → composables antes de componentes → componentes antes de páginas

### Parallel Opportunities

- Phase 1: T001-T004 en paralelo excepto T002/T003 que dependen de T001
- Phase 2: T005 única (bloqueante)
- US1: T006+T007 (tests) en paralelo; luego T008/T009/T010 en paralelo; luego T011/T012/T013 en paralelo; luego T014-T018 en paralelo; luego T019→T020/T021/T022
- US2: T023 (test) primero; luego T024 en paralelo con T025/T026 (integración)
- US4: T030 (test) primero; luego T031/T032 en paralelo
- US5: T033/T034/T035 en paralelo; T036 después
- US6: T042 (install) primero; luego T043 y T044 en paralelo; luego T045 (iconos) puede ir en paralelo con T046; T047/T048/T049 después

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1: Setup
2. Phase 2: Foundational
3. Phase 3: US1 → STOP y VALIDAR con V-001/V-004
4. Deploy/demo si está listo

### Incremental Delivery

1. Setup + Foundational → base lista
2. US1 → test independiente → validar (MVP: refactor sin regresión)
3. US2 → test independiente → validar (persistencia blindada)
4. US3 → typecheck → validar (tipado estricto)
5. US4 → test independiente → validar (fix cuestas)
6. US5 → validación visual → validar (limpieza)
7. US6 → build + validación en Vercel → validar (PWA instalable + offline)
8. Polish: quickstart completo (V-001 a V-009)

### Parallel Team Strategy

Con varios devs:
1. Setup + Foundational juntos
2. Dev A: US1 · Dev B: US2 (tras US1 base si comparte ficheros, o secuencial)
3. Dev C: US4 (tras pace.ts/missions.ts de US1)
4. Dev D: US5 (tras la descomposición)
5. Dev E: US6 (tras US1/US5; toca nuxt.config.ts y public/ — si un dev ya trabaja en nuxt.config.ts, esperar)

---

## Notes

- [P] tasks = ficheros distintos, sin dependencias
- [Story] label mapea a las user stories del spec (US1-US6)
- Cada user story es completable y testeable de forma independiente
- Verificar que los tests fallan antes de implementar (TDD)
- Commit tras cada task o grupo lógico
- Parar en cada checkpoint para validar la historia de forma independiente
- La contraseña del login NO se toca (FR-012) — solo se mueve de ubicación
- La PWA (US6) usa `@vite-pwa/nuxt`; validar SIEMPRE sobre el build de producción (el SW está desactivado en `npm run dev`)
