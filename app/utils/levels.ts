/* ============================================================================
   RUN·ARCADE — Presets de nivel predeterminado (funciones puras)
   ----------------------------------------------------------------------------
   Define los niveles FÁCIL / INTERMEDIO / AVANZADO / ÉLITE y su marca de 10K
   asociada. `nearestLevel` permite sincronizar el nivel activo desde cualquier
   valor de time10k (incluido el ajuste fino con las flechas). Sin estado.
   ============================================================================ */

import type { LevelKey, LevelPreset } from './types'

/** Presets de nivel, ordenados de más lento a más rápido. */
export const LEVELS: LevelPreset[] = [
  { key: 'facil', label: 'FÁCIL', hex: '#39ff88', time10k: 2700 },
  { key: 'intermedio', label: 'INTERMEDIO', hex: '#35c1ff', time10k: 2400 },
  { key: 'avanzado', label: 'AVANZADO', hex: '#ff8a1e', time10k: 2100 },
  { key: 'elite', label: 'ÉLITE', hex: '#ff4b3e', time10k: 1800 },
]

/** Devuelve el preset por clave (null si la clave no existe). */
export function levelByKey(key: LevelKey | null | undefined): LevelPreset | null {
  if (!key) return null
  return LEVELS.find((lvl) => lvl.key === key) ?? null
}

/**
 * Preset más cercano a una marca de 10K dada.
 * En empate exacto (punto medio entre dos presets) gana el más lento
 * (primero del array): comportamiento determinista y conservador.
 */
export function nearestLevel(time10kSec: number): LevelPreset {
  let best = LEVELS[0]!
  let bestDist = Number.POSITIVE_INFINITY
  for (const lvl of LEVELS) {
    const dist = Math.abs(lvl.time10k - time10kSec)
    if (dist < bestDist) {
      bestDist = dist
      best = lvl
    }
  }
  return best
}
