# Task Breakdown: Selector de nivel predeterminado

**Branch**: `002-selector-nivel` | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

Orden de ejecución (dependencias estrictas: tipos → utils → persistencia → composable → UI → tests).

---

## Fase 1 — Dominio puro y tipos

### T1.1 — Tipos de nivel en `app/utils/types.ts`
- [ ] Añadir `export type LevelKey = 'facil' | 'intermedio' | 'avanzado' | 'elite'`.
- [ ] Añadir `export interface LevelPreset { key: LevelKey; label: string; hex: string; time10k: number }`.
- [ ] Añadir `levelKey: LevelKey` al interfaz `UserSettings` (con comentario: preset activo más cercano a `time10k`).
- [ ] Añadir `export type NumericStateKey = Exclude<StateKey, 'levelKey'>`.

**Done**: compila el tipo en el resto de ficheros (esperado: error temporal en settings.ts hasta T1.3).

### T1.2 — Presets y helpers puros en `app/utils/levels.ts` (NUEVO)
- [ ] `LEVELS: LevelPreset[]` ordenado de más lento a más rápido:
  - FÁCIL `#39ff88` → 2700 s · INTERMEDIO `#35c1ff` → 2400 s · AVANZADO `#ff8a1e` → 2100 s · ÉLITE `#ff4b3e` → 1800 s.
- [ ] `levelByKey(key: LevelKey | null | undefined): LevelPreset | null` (find seguro, `?? null`).
- [ ] `nearestLevel(time10kSec: number): LevelPreset` (distancia mínima; en empate exacto gana el primer preset, i.e. el más lento — determinista).

**Done**: `levels.test.ts` (T5.1) pasa.

### T1.3 — Defaults y rangos en `app/utils/settings.ts`
- [ ] `DEFAULT_SETTINGS.levelKey = 'intermedio'` (coincide con `time10k: 2400`).
- [ ] `SETTINGS_RANGES` cambia su `satisfies` a `Record<Exclude<keyof UserSettings, 'levelKey'>, { min; max; step }>` (los steppers numéricos excluyen `levelKey`).

**Done**: `npm run test:run` verde tras T5 (los tests de settings/persistence existentes no se rompen).

### T1.4 — Persistencia tolerante en `app/utils/persistence.ts`
- [ ] Nueva función pura `sanitizeLevelKey(raw: unknown, time10kSec: number): LevelKey`:
  - si `raw` es una de las claves de `LEVELS` → se conserva;
  - en cualquier otro caso → `nearestLevel(time10kSec).key`.
- [ ] `sanitizeSettings`: iterar claves numéricas (de `SETTINGS_RANGES`, no de `DEFAULT_SETTINGS`) para los clamps, y al final `out.levelKey = sanitizeLevelKey(src.levelKey, out.time10k)`.

**Done**: `persistence.test.ts` ampliado (T5.2) pasa.

---

## Fase 2 — Composable

### T2.1 — `selectLevel` y sincronización bidireccional en `app/composables/useRunArcadeSetup.ts`
- [ ] Importar `levelByKey`, `nearestLevel` de `../utils/levels` y el tipo `LevelKey`.
- [ ] Nueva función `selectLevel(key: LevelKey)`:
  - `const preset = levelByKey(key); if (!preset) return;`
  - `state.levelKey = preset.key; state.time10k = preset.time10k;`
- [ ] En `step(key: StateKey, dir)`: guarda `if (key === 'levelKey') return` al inicio (necesario tras añadir `levelKey` a `UserSettings`); tras mutar, `if (key === 'time10k') state.levelKey = nearestLevel(state.time10k).key`.
- [ ] `cycleFromList(key, ...)` tipa su parámetro como `NumericStateKey`.
- [ ] Exponer `selectLevel` en el return del composable.

**Done**: `npm run build` compila sin errores de tipo (junto con Fase 3).

---

## Fase 3 — UI

### T3.1 — Sección de nivel en `app/components/MissionMenu.vue`
- [ ] Importar `LEVELS` de `../utils/levels` y el tipo `LevelKey`.
- [ ] Añadir al `defineEmits` el evento `selectLevel: [key: LevelKey]`.
- [ ] Insertar, **justo encima** del bloque 'MARCA 10K', una sección con etiqueta `NIVEL` y `grid grid-cols-4 gap-1.5`:
  - Tarjetas `press` con borde `border-2`, superficie `bg-panel-2`, tipografía `font-display`.
  - Borde/sombra por nivel: activo → `borderColor: lvl.hex` + glow `boxShadow: 0 0 12px ${lvl.hex}66`; inactivo → `borderColor: '#232b38'` (line), sin glow.
  - Contenido: `label` en `font-display` (color `lvl.hex`) + marca `fmtPace(lvl.time10k)` pequeña en `text-muted`.
  - Activo si `settings.levelKey === lvl.key`.
  - `@click="emit('selectLevel', lvl.key)"`.
- [ ] Las tarjetas de misión del menú NO cambian (se quedan limpias).

### T3.2 — Cableado en `app/components/RunArcadeConsole.vue`
- [ ] Desestructurar `selectLevel` de `useRunArcadeSetup`.
- [ ] `<MissionMenu ... @select-level="selectLevel" />`.

**Done**: `npm run build` genera sin errores y la app en `npm run dev` muestra la sección en el menú.

---

## Fase 4 — Tests

### T4.1 — `tests/unit/levels.test.ts` (NUEVO)
- [ ] `LEVELS` tiene 4 presets con claves únicas, `time10k` múltiplos de 30 dentro de [1800, 3600], y los valores confirmados (2700/2400/2100/1800).
- [ ] `levelByKey` devuelve el preset para cada clave válida y `null` para claves desconocidas/null/undefined.
- [ ] `nearestLevel`:
  - coincide exacto con cada preset;
  - valores intermedios → preset más cercano (ej. 2550 → FÁCIL por empate determinista; 2530 → FÁCIL; 2570 → INTERMEDIO... según distancias reales);
  - extremos del rango (1800 → ÉLITE, 3600 → FÁCIL).

### T4.2 — Ampliar `tests/unit/persistence.test.ts`
- [ ] `sanitizeSettings` conserva un `levelKey` válido.
- [ ] `sanitizeSettings` con `levelKey` inválido (ej. `'extremo'`) → lo deriva de `time10k` (ej. `time10k: 2100` → `'avanzado'`).
- [ ] `sanitizeSettings` sin `levelKey` → derivado del default (`time10k: 2400` → `'intermedio'`).
- [ ] Round-trip `serializePersisted`/`parsePersisted` preserva `levelKey`.

---

## Fase 5 — Convergencia

### T5.1 — Verificación completa
- [ ] `npm run test:run` → todos los tests en verde (incl. regresión de pace/formatters/persistence).
- [ ] `npm run build` → compila con TypeScript estricto sin errores.
- [ ] Revisión manual (`npm run dev`): pulsar cada nivel actualiza MARCA 10K y la foto rápida sin recarga; flechas mueven el resaltado al nivel más cercano; recargar la página conserva nivel + marca; localStorage antiguo sin `levelKey` carga sin romper.
