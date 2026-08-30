/* ============================================================================
   RUN·ARCADE — Configuración por defecto y rangos de validación
   ----------------------------------------------------------------------------
   Valores iniciales del estado y límites de clamp para la persistencia.
   ============================================================================ */

import type { UserSettings } from './types'

/** Estado de configuración por defecto (usado al arrancar sin datos guardados). */
export const DEFAULT_SETTINGS: UserSettings = {
  time10k: 2400,
  levelKey: 'intermedio',
  energyIndex: 1,
  seriesReps: 6,
  seriesDist: 800,
  tempoMin: 20,
  aerobicKm: 8,
  regenMin: 35,
  fartlekReps: 8,
  cacosReps: 10,
  longRunKm: 12,
  progressiveKm: 10,
  hillReps: 8,
  hillDuration: 60,
}

/** Rangos [min, max] y paso de ajuste para cada campo ajustable del estado. */
export const SETTINGS_RANGES = {
  time10k: { min: 1800, max: 3600, step: 30 },
  energyIndex: { min: 0, max: 2, step: 1 },
  seriesReps: { min: 3, max: 12, step: 1 },
  seriesDist: { min: 400, max: 1000, step: 200 },
  tempoMin: { min: 10, max: 45, step: 5 },
  aerobicKm: { min: 4, max: 16, step: 1 },
  regenMin: { min: 20, max: 60, step: 5 },
  fartlekReps: { min: 4, max: 14, step: 1 },
  cacosReps: { min: 4, max: 16, step: 1 },
  longRunKm: { min: 8, max: 30, step: 1 },
  progressiveKm: { min: 6, max: 18, step: 2 },
  hillReps: { min: 4, max: 12, step: 1 },
  hillDuration: { min: 45, max: 90, step: 15 },
} satisfies Record<Exclude<keyof UserSettings, 'levelKey'>, { min: number; max: number; step: number }>

/** Valores discretos para campos que ciclan por lista (seriesDist, hillDuration). */
export const SERIES_DISTANCES = [400, 800, 1000]
export const HILL_DURATIONS = [45, 60, 90]
