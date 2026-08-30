# Data Model: Refactor de RUN·ARCADE

**Date**: 2026-08-30
**Phase**: 1 (Design & Contracts)

## Entities

### UserSettings

Configuración persistida del usuario. Es la fuente de verdad del estado reactivo.

| Campo | Tipo | Rango / Valores | Default | Notas |
|-------|------|-----------------|---------|-------|
| `time10k` | `number` (segundos) | `[1800, 3600]` | `2400` | Marca de 10K; se ajusta en pasos de ±30s |
| `energyIndex` | `number` | `[0, 2]` (índice de `ENERGY_LEVELS`) | `1` | 0=fresco, 1=normal, 2=cansado |
| `seriesReps` | `number` | `[3, 12]` | `6` | |
| `seriesDist` | `number` (metros) | `[400, 800, 1000]` | `800` | Cicla por la lista de `config.distances` |
| `tempoMin` | `number` | `[10, 45]`, paso 5 | `20` | |
| `aerobicKm` | `number` | `[4, 16]` | `8` | |
| `regenMin` | `number` | `[20, 60]`, paso 5 | `35` | |
| `fartlekReps` | `number` | `[4, 14]` | `8` | |
| `cacosReps` | `number` | `[4, 16]` | `10` | |
| `longRunKm` | `number` | `[8, 30]` | `12` | |
| `progressiveKm` | `number` | `[6, 18]`, paso 2 | `10` | |
| `hillReps` | `number` | `[4, 12]` | `8` | |
| `hillDuration` | `number` (segundos) | `[45, 60, 90]` | `60` | Cicla por `config.durations` |

**Validaciones**:
- Todos los rangos se aplican con `clamp` al restaurar (`sanitizeSettings`).
- Cada campo tiene un default independiente (no depende del estado guardado).

**Relaciones**: `UserSettings` es consumido por `buildPlan()` (junto con `Mission`) para producir `RunPlan`. `StateKey` (tipo derivado) identifica cada campo y se usa en los `params` de los bloques de misión.

### EnergyLevel

Nivel de energía/fatiga del día, derivado de `energyIndex`.

| Campo | Tipo | Valores |
|-------|------|---------|
| `key` | `string` | `'fresco' \| 'normal' \| 'cansado'` |
| `label` | `string` | `'FRESCO' \| 'NORMAL' \| 'CANSADO'` |
| `note` | `string` | Texto explicativo del multiplicador |
| `mult` | `number` | `0.98 \| 1.0 \| 1.05` |
| `hex` | `string` | Color asociado |

**Validaciones**: `energyIndex` siempre se clampa a `[0, 2]`; fuera de ese rango el sistema usa `ENERGY_LEVELS[1]` (normal) como fallback.

### Mission

Configuración de una misión de entrenamiento (catálogo base o personalizada).

| Campo | Tipo | Notas |
|-------|------|-------|
| `key` | `string` | Identificador único; las personalizadas usan prefijo `custom_` |
| `name` | `string` | Nombre corto (p. ej. "SERIES") |
| `sub` | `string` | Subtítulo |
| `icon` | `string` | Emoji/glifo |
| `hex` | `string` | Color principal |
| `tip` | `string` | Consejo del coach |
| `type` | `'custom'` | Tipo de misión |
| `planConfig` | `PlanConfig` | Bloques + config opcional |

**Relaciones**: `Mission` es la fuente de verdad estática (`utils/missions.ts`) para las 9 misiones base, más las personalizadas en `customMissions` (persistidas). No se persiste el catálogo base.

### PlanConfig

| Campo | Tipo | Notas |
|-------|------|-------|
| `blocks` | `PlanBlock[]` | Lista ordenada de bloques (warmup → principal → cooldown) |
| `config` | `{ distances?: number[], durations?: number[] }` (opcional) | Opciones de ciclo (series → distancias, cuestas → duraciones) |

### PlanBlock (unión discriminada por `type`)

| `type` | Campos específicos |
|--------|--------------------|
| `warmup` | `unit: 'duration'`, `value: number` |
| `cooldown` | `unit: 'duration'`, `value: number` |
| `run` | `label`, `metaTemplate`, `unit: 'duration' \| 'distance'`, `value?`, `value_param?`, `offset` |
| `interval` | `label`, `metaTemplate`, `work_offset`, `rec_pace_offset`, `params: { reps: StateKey, dist?: StateKey, work_s?: number, rec_s: number }` |
| `progressive` | `label`, `param: StateKey`, `offsets: [PaceKey, PaceKey, PaceKey]` |
| `hills` | `label`, `metaTemplate`, `work_offset`, `rec_pace_offset`, `params: { reps: StateKey, work_s: StateKey, rec_multiplier: number }` |
| `pyramid` | `label`, `metaTemplate`, `work_offset`, `rec_pace_offset`, `params: { steps_min: number[], rec_s: number }` |
| `extra` | `label`, `meta`, `sec`, `km`, `hex` |

**Validaciones**:
- `metaTemplate` usa placeholders `{value}`, `{reps}`, `{dist}`, `{work_s}`, `{rec_s}` según el tipo.
- `StateKey` garantiza en tiempo de compilación que `state[param]` existe (resuelve #11).
- Los bloques personalizados creados en el formulario solo producen `warmup`, `cooldown`, `run`.

### PlanStep

Paso individual del plan generado (desglose de la foto rápida).

| Campo | Tipo | Notas |
|-------|------|-------|
| `tag` | `string` | `'WARM-UP' \| 'MAIN' \| 'COOL-DOWN' \| 'EXTRA'` |
| `label` | `string` | Nombre visible |
| `meta` | `string` | Descripción (p. ej. "8 km continuos") |
| `pace` | `number \| null` | Ritmo en s/km del paso (null para EXTRA) |
| `km` | `number` | Distancia estimada |
| `sec` | `number` | Tiempo estimado en segundos |
| `hex` | `string` | Color |
| `recPace` | `number \| null` (opcional) | Ritmo de recuperación (intervalos/cuestas/pirámide) |

### RunPlan

| Campo | Tipo | Notas |
|-------|------|-------|
| `steps` | `PlanStep[]` | Pasos ordenados |
| `totalKm` | `number` | Suma de `km` |
| `totalSec` | `number` | Suma de `sec` |
| `tip` | `string` | Consejo del coach |
| `mission` | `Mission` | Misión de origen |

### PersistedStateV2 (formato de localStorage)

| Campo | Tipo | Notas |
|-------|------|-------|
| `version` | `number` | `2` |
| `settings` | `UserSettings` | Configuración (sanitizada) |
| `customMissions` | `Mission[]` | Solo misiones personalizadas |

**Formato legado v1 (para migración)**:
```json
{ "time10k": 2400, "energyIndex": 1, "seriesReps": 6, "...": "...", "missions": [ ... ] }
```

**Reglas de migración v1 → v2**:
1. Si no existe `version` o existe `missions` → es v1.
2. `settings` = `sanitizeSettings(estado)` (clamps + defaults por campo).
3. `customMissions` = de `missions[]` solo las que `key.startsWith('custom_')`.
4. Se escribe de vuelta el formato v2 (el `watch` debounced lo persiste automáticamente).

## State Transitions

1. **Carga de la app** (`onMounted`):
   `localStorage.read` → `try/catch JSON.parse` → ¿v1? → migrar → `sanitizeSettings` → `Object.assign(state, settings)` → `customMissions = merged`.
2. **Restauración**: `state` reactivo recibe settings saneados; el catálogo visible = `[...MISSIONS, ...customMissions]` (fusión #9).
3. **Cambio de usuario** (steppers, energy, 10K, formulario): muta `state` → `watch` deep → `debounce(400ms)` → `saveState`.
4. **Crear misión**: `state.customMissions.push(...)` → persistido como parte del watch.
5. **Borrar misión**: `splice` de `customMissions` (solo `custom_*`).
