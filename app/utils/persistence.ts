/* ============================================================================
   RUN·ARCADE — Persistencia (funciones puras)
   ----------------------------------------------------------------------------
   Esquema versionado { version, settings, customMissions }.
   El catálogo base de misiones NO se persiste: siempre viene del código.
   Migra el formato legado v1 (plano, con missions[]) a v2.
   Nunca lanza: ante cualquier error devuelve defaults.
   ============================================================================ */

import { MISSIONS, STORAGE_KEY, STORAGE_VERSION } from './missions'
import { DEFAULT_SETTINGS, SETTINGS_RANGES } from './settings'
import type { Mission, PersistedStateV2, UserSettings } from './types'

/** Valor dentro del rango [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(Math.max(value, min), max)
}

/** Estado saneado: defaults por campo + clamp al rango definido. */
export function sanitizeSettings(raw: unknown): UserSettings {
  const src = raw && typeof raw === 'object' ? (raw as Partial<UserSettings>) : {}
  const out = { ...DEFAULT_SETTINGS }

  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof UserSettings)[]) {
    const range = SETTINGS_RANGES[key]
    const value = src[key]
    if (typeof value !== 'number' || !Number.isFinite(value)) continue
    out[key] = clamp(value, range.min, range.max)
  }
  return out
}

/** Misiones válidas: con key y planConfig.blocks. */
export function sanitizeMissions(raw: unknown): Mission[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (m): m is Mission =>
      !!m &&
      typeof m === 'object' &&
      typeof (m as Mission).key === 'string' &&
      !!m &&
      typeof (m as Mission).planConfig === 'object',
  )
}

/** Detecta el formato v1 plano (sin `version`, con campos aplanados en la raíz). */
function isLegacyV1(raw: Record<string, unknown>): boolean {
  return raw.version !== 2 && typeof raw.time10k === 'number'
}

/** Convierte un estado v1 a v2: settings desde la raíz, customMissions desde missions[]. */
function migrateV1(raw: Record<string, unknown>): PersistedStateV2 {
  return {
    version: 2,
    settings: sanitizeSettings(raw),
    customMissions: sanitizeMissions(raw.missions).filter((m) => m.key.startsWith('custom_')),
  }
}

/** Parsea el contenido de localStorage (string o null) a un estado válido. Nunca lanza. */
export function parsePersisted(raw: string | null): PersistedStateV2 {
  if (!raw) return { version: 2, settings: { ...DEFAULT_SETTINGS }, customMissions: [] }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') {
      return { version: 2, settings: { ...DEFAULT_SETTINGS }, customMissions: [] }
    }
    const obj = parsed as Record<string, unknown>

    if (isLegacyV1(obj)) return migrateV1(obj)

    // v2 (o cualquier objeto con version y settings)
    const settings = sanitizeSettings(obj.settings ?? obj)
    const customMissions = sanitizeMissions(obj.customMissions)
    return { version: 2, settings, customMissions }
  } catch {
    return { version: 2, settings: { ...DEFAULT_SETTINGS }, customMissions: [] }
  }
}

/** Serializa el estado v2 para localStorage. */
export function serializePersisted(state: PersistedStateV2): string {
  return JSON.stringify({ ...state, version: STORAGE_VERSION })
}

/** Catálogo visible = base del código + custom (base prevalece ante colisiones de key). */
export function mergeCatalog(base: Mission[], custom: Mission[]): Mission[] {
  const baseKeys = new Set(base.map((m) => m.key))
  return [...base, ...custom.filter((m) => !baseKeys.has(m.key))]
}

/** Lee y parsea de localStorage (solo cliente). Nunca lanza. */
export function readPersisted(): PersistedStateV2 {
  if (!import.meta.client) return { version: 2, settings: { ...DEFAULT_SETTINGS }, customMissions: [] }
  try {
    return parsePersisted(localStorage.getItem(STORAGE_KEY))
  } catch {
    return { version: 2, settings: { ...DEFAULT_SETTINGS }, customMissions: [] }
  }
}

/** Escribe en localStorage (solo cliente). Nunca lanza. */
export function writePersisted(state: PersistedStateV2): void {
  if (!import.meta.client) return
  try {
    localStorage.setItem(STORAGE_KEY, serializePersisted(state))
  } catch {
    /* almacenamiento no disponible: ignorar */
  }
}
