import { describe, it, expect } from 'vitest'
import { LEVELS, levelByKey, nearestLevel } from '../../app/utils/levels'
import type { LevelKey } from '../../app/utils/types'

describe('LEVELS presets', () => {
  it('contiene exactamente los 4 niveles confirmados, con marcas y colores asociados', () => {
    expect(LEVELS.map((l) => l.key)).toEqual(['facil', 'intermedio', 'avanzado', 'elite'])
    expect(LEVELS).toMatchObject([
      { key: 'facil', label: 'FÁCIL', hex: '#39ff88', time10k: 2700 },
      { key: 'intermedio', label: 'INTERMEDIO', hex: '#35c1ff', time10k: 2400 },
      { key: 'avanzado', label: 'AVANZADO', hex: '#ff8a1e', time10k: 2100 },
      { key: 'elite', label: 'ÉLITE', hex: '#ff4b3e', time10k: 1800 },
    ])
  })

  it('todas las marcas son múltiplos de 30 dentro del rango válido [1800, 3600]', () => {
    for (const lvl of LEVELS) {
      expect(lvl.time10k % 30).toBe(0)
      expect(lvl.time10k).toBeGreaterThanOrEqual(1800)
      expect(lvl.time10k).toBeLessThanOrEqual(3600)
    }
  })

  it('está ordenado de más lento a más rápido', () => {
    const times = LEVELS.map((l) => l.time10k)
    expect([...times].sort((a, b) => b - a)).toEqual(times)
  })
})

describe('levelByKey', () => {
  it('devuelve el preset para cada clave válida', () => {
    for (const lvl of LEVELS) {
      expect(levelByKey(lvl.key)).toEqual(lvl)
    }
  })

  it('devuelve null para claves desconocidas o vacías', () => {
    expect(levelByKey('extremo' as LevelKey)).toBeNull()
    expect(levelByKey(null)).toBeNull()
    expect(levelByKey(undefined)).toBeNull()
  })
})

describe('nearestLevel', () => {
  it('coincide exactamente con cada preset', () => {
    for (const lvl of LEVELS) {
      expect(nearestLevel(lvl.time10k).key).toBe(lvl.key)
    }
  })

  it('acerca al preset con menor distancia', () => {
    // 2530 s (42:10) está más cerca de intermedio (2400) que de fácil (2700)
    expect(nearestLevel(2530).key).toBe('intermedio')
    // 2620 s (43:40) está más cerca de fácil (2700) que de intermedio (2400)
    expect(nearestLevel(2620).key).toBe('facil')
    // 2150 s (35:50) está más cerca de avanzado (2100) que de intermedio (2400)
    expect(nearestLevel(2150).key).toBe('avanzado')
    // 1850 s (30:50) está más cerca de élite (1800) que de avanzado (2100)
    expect(nearestLevel(1850).key).toBe('elite')
  })

  it('en empate exacto (punto medio) gana el nivel más lento, de forma determinista', () => {
    // Punto medio fácil(2700)/intermedio(2400) = 2550 → gana fácil
    expect(nearestLevel(2550).key).toBe('facil')
    // Punto medio intermedio(2400)/avanzado(2100) = 2250 → gana intermedio
    expect(nearestLevel(2250).key).toBe('intermedio')
    // Punto medio avanzado(2100)/élite(1800) = 1950 → gana avanzado
    expect(nearestLevel(1950).key).toBe('avanzado')
  })

  it('es estable en los extremos del rango válido', () => {
    expect(nearestLevel(1800).key).toBe('elite')
    expect(nearestLevel(3600).key).toBe('facil')
  })
})
