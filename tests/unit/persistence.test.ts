import { describe, it, expect } from 'vitest'
import {
  clamp,
  sanitizeLevelKey,
  sanitizeSettings,
  sanitizeMissions,
  parsePersisted,
  serializePersisted,
  mergeCatalog,
} from '../../app/utils/persistence'
import { MISSIONS, STORAGE_VERSION } from '../../app/utils/missions'
import type { PersistedStateV2, UserSettings } from '../../app/utils/types'

describe('clamp', () => {
  it('clampa valores dentro del rango', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
  })
})

describe('sanitizeSettings', () => {
  it('devuelve los defaults para entradas no válidas', () => {
    expect(sanitizeSettings(null)).toEqual(expect.objectContaining({ time10k: 2400, energyIndex: 1 }))
    expect(sanitizeSettings('garbage')).toEqual(expect.objectContaining({ time10k: 2400 }))
    expect(sanitizeSettings(undefined)).toEqual(expect.objectContaining({ time10k: 2400 }))
  })

  it('clampa los valores fuera de rango', () => {
    const s = sanitizeSettings({ energyIndex: 99, time10k: 99 } as Partial<UserSettings>)
    expect(s.energyIndex).toBe(2)
    expect(s.time10k).toBe(1800)
    const s2 = sanitizeSettings({ energyIndex: -5, time10k: 9999 } as Partial<UserSettings>)
    expect(s2.energyIndex).toBe(0)
    expect(s2.time10k).toBe(3600)
  })

  it('clampa los parámetros de misión', () => {
    const s = sanitizeSettings({ seriesReps: 999, hillDuration: 0 } as Partial<UserSettings>)
    expect(s.seriesReps).toBe(12)
    expect(s.hillDuration).toBe(45)
  })

  it('conserva los valores válidos', () => {
    const s = sanitizeSettings({ time10k: 2700, energyIndex: 2, seriesReps: 8 } as Partial<UserSettings>)
    expect(s.time10k).toBe(2700)
    expect(s.energyIndex).toBe(2)
    expect(s.seriesReps).toBe(8)
  })
})

describe('sanitizeLevelKey', () => {
  it('conserva un levelKey válido', () => {
    expect(sanitizeLevelKey('avanzado', 2400)).toBe('avanzado')
    expect(sanitizeLevelKey('elite', 2700)).toBe('elite')
  })

  it('deriva el nivel más cercano cuando levelKey es inválido o ausente', () => {
    expect(sanitizeLevelKey('extremo', 2100)).toBe('avanzado')
    expect(sanitizeLevelKey(42, 1800)).toBe('elite')
    expect(sanitizeLevelKey(null, 2400)).toBe('intermedio')
    expect(sanitizeLevelKey(undefined, 2700)).toBe('facil')
  })
})

describe('sanitizeSettings con levelKey', () => {
  it('el default deriva intermedio de la marca por defecto (40:00)', () => {
    expect(sanitizeSettings(null).levelKey).toBe('intermedio')
  })

  it('conserva un levelKey válido del estado guardado', () => {
    const s = sanitizeSettings({ levelKey: 'elite' } as Partial<UserSettings>)
    expect(s.levelKey).toBe('elite')
  })

  it('corrige un levelKey inválido derivándolo de la marca saneada', () => {
    const s = sanitizeSettings({ levelKey: 'bajo', time10k: 2100 } as unknown as Partial<UserSettings>)
    expect(s.levelKey).toBe('avanzado')
    const s2 = sanitizeSettings({ levelKey: 'bajo', time10k: 9999 } as unknown as Partial<UserSettings>)
    // time10k clampa a 3600 → nivel más cercano: fácil
    expect(s2.time10k).toBe(3600)
    expect(s2.levelKey).toBe('facil')
  })
})

describe('sanitizeMissions', () => {
  it('filtra misiones no válidas y sin key', () => {
    expect(sanitizeMissions(null)).toEqual([])
    expect(sanitizeMissions([{ name: 'sin key' }])).toEqual([])
  })

  it('conserva misiones con key y planConfig válido', () => {
    const m = { key: 'custom_x', name: 'X', planConfig: { blocks: [] } }
    const out = sanitizeMissions([m])
    expect(out).toHaveLength(1)
    expect(out[0]?.key).toBe('custom_x')
  })
})

describe('parsePersisted', () => {
  it('devuelve defaults para JSON corrupto sin lanzar', () => {
    const r = parsePersisted('{no es json')
    expect(r.settings.time10k).toBe(2400)
    expect(r.customMissions).toEqual([])
  })

  it('devuelve defaults para null', () => {
    const r = parsePersisted('null')
    expect(r.settings.time10k).toBe(2400)
  })

  it('parsea formato v2', () => {
    const v2: PersistedStateV2 = {
      version: 2,
      settings: { ...sanitizeSettings(null), time10k: 2700 },
      customMissions: [{ key: 'custom_1', name: 'A', planConfig: { blocks: [] } } as never],
    }
    const r = parsePersisted(JSON.stringify(v2))
    expect(r.settings.time10k).toBe(2700)
    expect(r.customMissions).toHaveLength(1)
  })

  it('migra formato v1 plano (sin version) extrayendo solo misiones custom_*', () => {
    const v1 = {
      time10k: 2500,
      energyIndex: 0,
      seriesReps: 10,
      missions: [
        { key: 'suave', name: 'RITMO SUAVE' }, // base → se descarta
        { key: 'custom_1', name: 'Mi serie', hex: '#fff', planConfig: { blocks: [] } }, // custom → se conserva
      ],
    }
    const r = parsePersisted(JSON.stringify(v1))
    expect(r.settings.time10k).toBe(2500)
    expect(r.customMissions).toHaveLength(1)
    expect(r.customMissions[0]?.key).toBe('custom_1')
  })

  it('migra formato v1 con misiones y clampa settings', () => {
    const v1 = { time10k: 50, energyIndex: 99, missions: [] }
    const r = parsePersisted(JSON.stringify(v1))
    expect(r.settings.time10k).toBe(1800)
    expect(r.settings.energyIndex).toBe(2)
  })
})

describe('serializePersisted', () => {
  it('hace round-trip preservando el contenido', () => {
    const v2: PersistedStateV2 = {
      version: 2,
      settings: sanitizeSettings({ time10k: 3000 }),
      customMissions: [],
    }
    const parsed = parsePersisted(serializePersisted(v2))
    expect(parsed.settings.time10k).toBe(3000)
    expect(parsed.version).toBe(STORAGE_VERSION)
  })

  it('preserva el nivel seleccionado en el round-trip', () => {
    const v2: PersistedStateV2 = {
      version: 2,
      settings: sanitizeSettings({ levelKey: 'avanzado', time10k: 2100 }),
      customMissions: [],
    }
    const parsed = parsePersisted(serializePersisted(v2))
    expect(parsed.settings.levelKey).toBe('avanzado')
    expect(parsed.settings.time10k).toBe(2100)
  })

  it('un estado v2 antiguo sin levelKey carga derivando el nivel de la marca', () => {
    const oldV2 = JSON.stringify({
      version: 2,
      settings: { time10k: 2700, energyIndex: 1 },
      customMissions: [],
    })
    const parsed = parsePersisted(oldV2)
    expect(parsed.settings.time10k).toBe(2700)
    expect(parsed.settings.levelKey).toBe('facil')
  })
})

describe('mergeCatalog', () => {
  it('combina base + custom sin duplicar claves base', () => {
    const custom = [
      { key: 'custom_1', name: 'A', planConfig: { blocks: [] } },
      { key: 'suave', name: 'Falso suave', planConfig: { blocks: [] } }, // colisión con base
    ]
    const merged = mergeCatalog(MISSIONS, custom as never)
    expect(merged).toHaveLength(MISSIONS.length + 1)
    expect(merged.some((m) => m.key === 'custom_1')).toBe(true)
    // La base prevalece sobre la colisión
    expect(merged.find((m) => m.key === 'suave')?.name).toBe('RITMO SUAVE')
  })
})
