# Quickstart / Validación: Refactor de RUN·ARCADE

**Date**: 2026-08-30
**Phase**: 1 (Design & Contracts)

Guía para validar que el refactor cumple el spec. No contiene implementación; referencia los contratos (`contracts/README.md`) y el modelo de datos (`data-model.md`).

## Prerrequisitos

- Node + npm
- Dependencias instaladas: `npm install`
- DevDependency de test: `vitest` (instalado en la fase de implementación)

## Escenarios de validación

### V-001 · No-regresión funcional (SC-001, US-1)

1. Arrancar la app: `npm run dev` → abrir `http://localhost:3000`.
2. Login con la contraseña actual (parche temporal intacto — FR-012).
3. Recorrer el flujo completo y verificar que es idéntico al pre-refactor:
   - Ajustar marca 10K (◀ ▶, pasos de 30s, rango 30:00–60:00).
   - Seleccionar cada una de las 9 misiones y comprobar los controles de setup (series, cuestas, etc.).
   - Generar la foto rápida y verificar métricas (distancia, tiempo est., desglose, coach).
   - Crear una misión personalizada, guardarla, verla en el menú y borrarla.
   - Cambiar energía (fresco/normal/cansado) y ver el efecto en ritmos.
4. **Esperado**: los números mostrados coinciden con los del commit actual (regresión de referencia: se pueden comparar contra la versión pre-refactor vía `git stash` si se desea).

### V-002 · Persistencia blindada (SC-002, US-2, FR-004/005/006)

Desde la consola del navegador, antes de recargar, inyectar en `localStorage` la clave `runArcadeState` y recargar `/`:

1. **JSON corrupto**: `localStorage.setItem('runArcadeState', '{no es json')` → la app carga con defaults, sin errores.
2. **Null / objeto vacío**: `localStorage.setItem('runArcadeState', 'null')` → idem.
3. **Fuera de rango**: `localStorage.setItem('runArcadeState', JSON.stringify({ energyIndex: 99, time10k: 99 }))` → `energyIndex` se clampa (máx. 2) y `time10k` a 30:00 mínimo; la UI no se rompe.
4. **Formato legado v1**: pegar el estado plano con `missions[]` completo (incluyendo `custom_*`) → tras recargar, el catálogo muestra las 9 misiones base (del código) **más** las personalizadas; se re-guarda como v2.
5. **Misiones nuevas**: con un estado guardado v2 que no incluya una misión base recién añadida al código → la misión nueva aparece igualmente (el catálogo base no se persiste).

**Esperado**: en todos los casos la app carga al menú sin errores de consola.

### V-003 · Cálculo de CUESTAS corregido (SC-003, US-4, FR-008)

1. Fijar marca 10K y energía NORMAL.
2. Abrir CUESTAS con 8 repeticiones × 60s y recuperación ×2.
3. **Esperado**: la distancia total de la foto rápida incluye trabajo de subida + recuperación (mayor que la distancia previa que solo sumaba el trote de bajada) y es coherente con el tiempo estimado.
4. Probar combinaciones límite (reps min/max, energía fresco/cansado) → nunca produce valores negativos, NaN ni división por cero.

### V-004 · Tipado estricto y estructura (SC-004, US-3, FR-002/003)

1. `npx nuxi typecheck` (o `npm run build`) → **cero** errores de TypeScript (el tsconfig de Nuxt ya aplica `strict` + `noUncheckedIndexedAccess`).
2. Inspección de estructura:
   - `app/pages/[...slug].vue` contiene únicamente composición (redirige a `/` o renderiza la consola), sin catálogo ni motor de ritmos.
   - El catálogo vive en `app/utils/missions.ts`; el motor en `app/utils/pace.ts`; los formateadores en `app/utils/formatters.ts`.
   - No existen `app/components/Counter.vue` ni `Alert.vue` (FR-011).
3. **Esperado**: estructura según `plan.md` → `Project Structure`.

### V-005 · CSS único y tema consolidado (SC-005, US-5, FR-009)

1. Verificar que `@import "tailwindcss"` y `@theme` aparecen **una sola vez** (en `app/assets/css/tailwind.css`), cargado desde `nuxt.config.ts`.
2. `app/pages/style.css` ya no existe; no hay `import "./style.css"` en la página.
3. Inspeccionar el bundle de CSS (`npm run build` y revisar el CSS generado): sin bloques duplicados.
4. **Esperado**: la app se ve idéntica al pre-refactor (mismos colores, fuentes, scanlines CRT, animaciones blink/press).

### V-006 · Rutas (SC-006 implícito, US-5, FR-010)

1. `npm run dev` y comprobar:
   - `/` → renderiza la consola arcade.
   - `/ruta/desconocida` → redirige a `/` (la consola sigue siendo accesible desde cualquier URL, como antes).
   - `/about` (contenido markdown del starter) → **no** capturada por la app arcade (si se conserva el contenido).
2. **Esperado**: la ruta comodín no ensombrece rutas de contenido/estáticas futuras.

### V-007 · Tests unitarios (SC-004, Assumptions)

1. `npm test` (vitest run).
2. **Esperado**: todos los tests pasan:
   - `pace.test.ts`: `buildPlan` para las 9 misiones (valores de referencia), fix hills.
   - `formatters.test.ts`: límites (`fmtPace(240)` = `'4:00'`, `fmtDuration`, `fmtKm`, `levelLabel`).
   - `persistence.test.ts`: `parsePersisted` con JSON corrupto/null/v1/v2, `sanitizeSettings` clamps, `mergeCatalog` dedupe.

## Comandos resumen

```bash
npm install          # instalar deps (incluye vitest tras la fase de implementación)
npm run dev          # validación manual (V-001, V-002, V-003, V-006)
npm test             # tests unitarios (V-007)
npx nuxi typecheck   # tipado estricto (V-004)
npm run build        # build + verificación de CSS (V-005)
```
