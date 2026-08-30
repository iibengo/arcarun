# Research Notes: Refactor de RUN·ARCADE

**Date**: 2026-08-30
**Phase**: 0 (Outline & Research)

Formato: cada entrada documenta **Decisión**, **Rationale** y **Alternatives considered**.

---

## R-001: Mecanismo de rutas y conflicto con el contenido

- **Decision**: Crear `app/pages/index.vue` (renderiza la consola en `/`) y convertir `app/pages/[...slug].vue` en una página comodín que redirige a `/` (via `navigateTo`/`definePageMeta` con `redirect`) para cualquier slug desconocido. Se elimina el CSS de página y la lógica de negocio del catch-all.

- **Rationale**: Comprobación empírica con el dev server (`curl /`, `/about`, `/foo`): las tres respuestas devuelven la app arcade (login "Acceso Protegido"). Es decir, hoy `[...slug].vue` captura **todas** las rutas, incluidas `/` y `/about`, y el contenido markdown del starter (`content/index.md`, `content/about.md`) **nunca se renderiza**. Esto confirma el problema #5: el catch-all ensombrece cualquier ruta. Al mover la app a `index.vue` y dejar `[...slug]` como redirect, la app sigue accesible en `/` (igual que hoy desde cualquier URL, porque el redirect conserva la UX de "cualquier ruta lleva a la consola") y deja espacio para rutas de contenido o páginas futuras sin conflicto.

- **Alternatives considered**:
  - *Mantener toda la app en `[...slug]` y añadir `index.vue` duplicando el render*: duplica lógica y mantenimiento; descartado.
  - *Eliminar el catch-all por completo*: rompería los enlaces guardados con slugs (la UX actual deja que cualquier URL muestre la app); descartado.
  - *Usar `_content` / contenido como página raíz*: el contenido markdown es andamiaje del starter (la app real es el arcade); descartado.

---

## R-002: Separación de lógica pura (utils) vs. estado reactivo (composables)

- **Decision**: La lógica de negocio (motor de ritmos, formateadores, catálogo de misiones, persistencia) vive en funciones puras bajo `app/utils/` (auto-importadas por Nuxt). Los `composables/` solo orquestan estado reactivo y llaman a las utils. Los componentes son UI sin lógica de negocio.

- **Rationale**: Las funciones puras son directamente testables con Vitest sin montar la app (requisito del spec: "funciones puras, mismas entradas → mismas salidas"). Además, Nuxt auto-importa los exports de `app/utils/`, eliminando imports manuales y facilitando la reutilización. Esto resuelve #4 (monolito) y #2 (tipado): las utils quedan totalmente tipadas con `StateKey = keyof UserSettings`.

- **Alternatives considered**:
  - *Poner toda la lógica en composables*: los composables dependen del ciclo de vida de Vue y del estado reactivo, lo que dificulta el test unitario puro; descartado.
  - *Carpeta `functions/` custom*: Nuxt auto-importa específicamente `utils/` y `composables/`; usar una carpeta custom exigiría imports manuales; se usa `utils/` (convención Nuxt).
  - *Composables `useState` global con persistencia dentro*: mezcla lógica y estado; se prefiere persistencia como función pura (`loadState`/`saveState`) con el composable solo enganchando `onMounted`/`watch`.

---

## R-003: Esquema de persistencia versionado y migración

- **Decision**: Nuevo esquema `PersistedStateV2 = { version: 2, settings: UserSettings, customMissions: Mission[] }`. El catálogo base de misiones **no** se persiste: siempre se reconstruye desde `utils/missions.ts` (fuente de verdad en código). La migración detecta el formato legado plano (sin `version`, con `missions[]` aplanado) y lo convierte: extrae las misiones `custom_*` a `customMissions`, extrae settings, descarta el catálogo base viejo.

- **Rationale**: Resuelve #9 (el catálogo guardado congelaba misiones futuras): como solo se guardan las personalizadas, cualquier misión nueva añadida al código aparece automáticamente. Resuelve #3: `loadState` usa `try/catch`, aplica `sanitize` (clamps + defaults por campo) y nunca lanza. La migración v1→v2 se hace una sola vez (se re-guarda con `version: 2`).

- **Alternatives considered**:
  - *Seguir persistiendo el array `missions` completo (v1)*: causa el bug #9 (misiones nuevas no aparecen); descartado.
  - *Guardar un hash/checksum del catálogo y comparar*: más complejo y frágil; se prefiere simplemente no persistir el catálogo base.
  - *Migración destructiva (borrar localStorage)*: pierde misiones personalizadas del usuario; descartado.

---

## R-004: Testing con Vitest (sin instalar hasta implementar)

- **Decision**: Añadir `vitest` como `devDependency` (npm install -D vitest) y un `vitest.config.ts` mínimo con `environment: 'node'`. Los tests viven en `tests/unit/` y cubren: motor de ritmos (`buildPlan` para las 9 misiones + caso hills corregido), formateadores (casos límite), y persistencia (try/catch, clamps, migración v1→v2, fusión de catálogo).

- **Rationale**: El spec (SC-004 y Assumptions) exige tests de las funciones puras. Vitest es la herramienta estándar del stack del proyecto. Como las utils son puras y no dependen de Vue/DOM, `environment: 'node'` basta y es rápido.

- **Alternatives considered**:
  - *@vue/test-utils + jsdom para componentes*: sobrecarga sin valor para este refactor (la UI se valida manualmente vía quickstart y build); descartado (queda como mejora futura).
  - *Test runner integrado de Nuxt*: no existe uno propio para utils puras; Vitest es el estándar.
  - *No añadir tests*: incumple el spec; descartado.

---

## R-005: Tema visual Tailwind unificado (CSS duplicado #6)

- **Decision**: Consolidar todos los tokens y estilos en `app/assets/css/tailwind.css` (que ya se carga globalmente desde `nuxt.config.ts`). Mover los tokens `@theme` arcade (`--color-oled`, `--color-panel`, neones, fuentes Orbitron) y los estilos base (`.crt`, `.blink`, `.press`, `@font-face`, `html/body/#app`) desde `app/pages/style.css` al archivo global. Eliminar `app/pages/style.css` y el `import "./style.css"` de la página.

- **Rationale**: Resuelve #6: hoy Tailwind se importa dos veces (global + por página) con dos `@theme` distintos, duplicando CSS y haciendo frágil el diseño. Un único archivo global cargado desde `nuxt.config.ts` garantiza que los tokens arcade estén disponibles en toda la app (incluidos componentes extraídos) y elimina la dependencia del CSS de página.

- **Alternatives considered**:
  - *Dejar el tema en el CSS de página y mover el global*: invierte la jerarquía (el CSS de página solo aplica al cargar la página); descartado.
  - *Dos archivos CSS globales (tokens + base)*: funciona pero añade un archivo sin necesidad; se prefiere un único `tailwind.css`.
  - *Sobreescribir en `nuxt.config.css` ambos archivos*: mantiene la duplicación del `@import "tailwindcss"`; descartado.

---

## R-006: Distancia de CUESTAS (#10)

- **Decision**: En el bloque `hills` del motor, añadir el concepto de ritmo de trabajo: `work_pace` derivado con un offset propio (`work_offset`, p. ej. +20s/km sobre la base, ajustable por energía) y calcular la distancia como `km = total_work_s / work_pace + total_rec_s / rec_pace`.

- **Rationale**: Hoy `km = total_rec_s / rp` (solo cuenta el trote de bajada/recuperación), lo que infravalora la distancia total de CUESTAS. Al incluir el tiempo de subida dividido por un ritmo de subida plausible, la distancia total es coherente con el tiempo estimado (FR-008). El ritmo de subida usa el mismo `energy.mult` para mantenerse coherente con el resto del motor.

- **Alternatives considered**:
  - *Asignar una distancia fija por repetición*: arbitrario y sin relación con el motor de ritmos; descartado.
  - *Solo tiempo, sin distancia (km = 0 en trabajo)*: mantiene el bug actual de distancia corta; descartado.
  - *Usar el pace base sin offset*: ignoraría que la subida es más lenta por km; se usa `work_offset`.

---

## R-007: Autenticación (parche temporal, sin cambios)

- **Decision**: La contraseña hardcodeada ("Farah") y la lógica de `checkPassword` se conservan tal cual, solo movida a `composables/useRunArcadeAuth.ts` y `components/RunArcadeLogin.vue` para mantener la estructura. **No** se cambia el mecanismo de autenticación ni se añade backend.

- **Rationale**: Decisión explícita del usuario (FR-012). El objetivo del refactor es estructural; la seguridad se abordará en una feature futura separada.

- **Alternatives considered**: Ninguna (fuera de alcance por decisión del usuario).
