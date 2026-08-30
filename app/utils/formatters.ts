/* ============================================================================
   RUN·ARCADE — Formateadores puros
   ----------------------------------------------------------------------------
   Sin estado ni efectos laterales. Misma salida para la misma entrada.
   ============================================================================ */

/** Segundos → "m:ss" (p. ej. 240 → "4:00"). Nunca produce "m:60". */
export function fmtPace(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Segundos → "N min" o "Xh YYm" (p. ej. 1200 → "20 min", 4500 → "1h 15m"). */
export function fmtDuration(sec: number): string {
  const total = Math.round(sec / 60)
  if (total < 60) return `${total} min`
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${h}h ${String(m).padStart(2, '0')}m`
}

/** km → "N.N km" (p. ej. 8 → "8.0 km"). */
export function fmtKm(km: number): string {
  return `${km.toFixed(1)} km`
}

/** Etiqueta de nivel a partir de la marca de 10K en segundos. */
export function levelLabel(time10kSec: number): string {
  const base = Math.round(time10kSec / 10)
  return `10K · ${fmtPace(base)}/km`
}
