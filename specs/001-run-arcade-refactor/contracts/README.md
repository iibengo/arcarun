# Contracts: Refactor de RUN·ARCADE

**Date**: 2026-08-30
**Phase**: 1 (Design & Contracts)

Contratos de los módulos de la capa de lógica pura (`app/utils/`) y de orquestación (`app/composables/`). Estos contratos son la API que los componentes y los tests consumen.

## utils/types.ts — Tipos compartidos

```ts
export type StateKey = keyof UserSettings

export interface UserSettings { /* ver data-model.md */ }
export interface EnergyLevel { key: string; label: string; note: string; mult: number; hex: string }
export type PaceKey = 'warmup' | 'cooldown' | 'fartlekSlow' | 'recovery' | 'walk' | 'prog1' | 'prog2' | 'prog3'
export type BlockType = 'warmup' | 'cooldown' | 'run' | 'interval' | 'progressive' | 'hills' | 'pyramid' | 'extra'

export interface PlanBlock { /* unión discriminada por type, ver data-model.md */ }
export interface PlanConfig { blocks: PlanBlock[]; config?: { distances?: number[]; durations?: number[] } }
export interface Mission { key: string; name: string; sub: string; icon: string; hex: string; tip: string; type: 'custom'; planConfig: PlanConfig }

export interface PlanStep { tag: string; label: string; meta: string; pace: number | null; km: number; sec: number; hex: string; recPace?: number | null }
export interface RunPlan { steps: PlanStep[]; totalKm: number; totalSec: number; tip: string; mission: Mission }

export interface PersistedStateV2 { version: 2; settings: UserSettings; customMissions: Mission[] }
```

## utils/missions.ts — Catálogo y constantes

```ts
export const MISSIONS: Mission[]           // 9 misiones base (fuente de verdad en código)
export const ENERGY_LEVELS: EnergyLevel[]  // fresco / normal / cansado
export const PREDEFINED_COLORS: string[]   // paleta del formulario de creación
export const STORAGE_KEY: string           // 'runArcadeState'
export const STORAGE_VERSION: 2
```

## utils/formatters.ts — Funciones puras de formato

```ts
export function fmtPace(sec: number): string        // 240 → '4:00'; nunca produce '4:60'
export function fmtDuration(sec: number): string    // 1200 → '20 min'; 4500 → '1h 15m'
export function fmtKm(km: number): string           // 8 → '8.0 km'
export function levelLabel(time10kSec: number): string  // '10K · 4:00/km'
```

## utils/pace.ts — Motor de ritmos (funciones puras)

```ts
export const OFFSETS: Record<PaceKey, number>   // offsets s/km respecto al ritmo base

export function basePaceSec(time10kSec: number): number          // round(time10k / 10)
export function pace(baseSec: number, offsetKey: PaceKey, energyMult: number): number
export function energyFromIndex(settings: UserSettings, energyLevels: EnergyLevel[]): EnergyLevel

export function buildPlan(mission: Mission, settings: UserSettings): RunPlan | null
// - Procesa cada bloque según su tipo (warmup, cooldown, run, interval, progressive, hills, pyramid, extra)
// - hills: km = total_work_s / work_pace + total_rec_s / rec_pace   (fix #10)
// - Devuelve null si la misión no existe
```

## utils/persistence.ts — Persistencia (funciones puras, sin estado global)

```ts
export function clamp(value: number, min: number, max: number): number
export function sanitizeSettings(raw: unknown): UserSettings      // defaults + clamps por campo
export function sanitizeMissions(raw: unknown): Mission[]         // solo válidas, con defaults
export function parsePersisted(raw: string | null): PersistedStateV2  // try/catch, detecta v1 y migra
export function serializePersisted(state: PersistedStateV2): string
export function mergeCatalog(base: Mission[], custom: Mission[]): Mission[]  // base + custom (dedupe por key)
```

## composables/useRunArcadeState.ts — Estado + persistencia

```ts
export function useRunArcadeState() {
  const state: Ref<UnwrapRef<UserSettings>>       // reactivo
  const customMissions: Ref<Mission[]>            // misiones personalizadas
  const catalog: ComputedRef<Mission[]>           // [...MISSIONS, ...customMissions]
  onMounted(loadFromStorage)                       // parsePersisted + Object.assign + watch
  watch([state, customMissions], saveDebounced, { deep: true })
  // API:
  addCustomMission(mission: Mission): void
  deleteCustomMission(key: string): void           // solo keys custom_*
}
```

## composables/useRunArcadeAuth.ts — Auth (parche temporal, intacto)

```ts
export function useRunArcadeAuth() {
  const isAuthenticated: Ref<boolean>
  const password: Ref<string>
  const errorMessage: Ref<string>
  checkPassword(): void   // comparación con "Farah" (intacta por decisión del usuario)
}
```

## composables/useRunArcadeSetup.ts — Navegación y configuración

```ts
export function useRunArcadeSetup(state: UserSettings, catalog: Mission[]) {
  const view: Ref<'menu' | 'create' | 'setup'>
  const missionKey: Ref<string | null>
  const newMissionData: Ref<Mission | null>
  const activeMission: ComputedRef<Mission | null>
  const plan: ComputedRef<RunPlan | null>          // buildPlan(activeMission, state) cuando view === 'setup'
  const energy: ComputedRef<EnergyLevel>

  // Steppers genéricos (clamp por rango) y ciclos (seriesDist, hillDuration)
  step(key: StateKey, dir: -1 | 1, min: number, max: number, step: number): void
  cycleFromList(key: StateKey, dir: -1 | 1, options: number[]): void

  selectMission(key: string): void
  backToMenu(): void
  showCreateForm(): void
  saveNewMission(): void
  shiftEnergy(dir: -1 | 1): void
  stepBaseTime(dir: -1 | 1): void   // ±30s, clamp [1800, 3600]
  launch(): void                    // overlay READY? (2.2s)
}
```

## Componentes (UI, sin lógica de negocio)

| Componente | Props/Emits | Contenido |
|------------|-------------|-----------|
| `RunArcadeLogin` | emit `success` | Form login (parche intacto) |
| `RunArcadeConsole` | `auth` (estado) | Carcasa CRT, pantalla, mando, overlay READY? |
| `MissionMenu` | `catalog`, `settings`, `energy`, handlers | Ajuste 10K, cuadrícula, energía, botón "+" |
| `MissionSetup` | `plan`, `settings`, `energy`, handlers | Controles por misión + PlanCard + acciones |
| `PlanCard` | `plan`, `energy` | Foto rápida (métricas, pasos, coach) |
| `CreateMissionForm` | `model`, handlers | Editor de bloques + guardar/cancelar |

## Tests (tests/unit)

| Archivo | Contratos cubiertos |
|---------|---------------------|
| `pace.test.ts` | `buildPlan` para las 9 misiones, regresión de números, fix hills #10 |
| `formatters.test.ts` | `fmtPace` (límites, sin 4:60), `fmtDuration`, `fmtKm`, `levelLabel` |
| `persistence.test.ts` | `parsePersisted` (try/catch, v1→v2, clamps), `sanitizeSettings`, `mergeCatalog` |
