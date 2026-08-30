import { describe, it, expect } from 'vitest'
import { basePaceSec, pace, energyFromIndex, buildPlan } from '../../app/utils/pace'
import { MISSIONS, ENERGY_LEVELS } from '../../app/utils/missions'
import type { UserSettings } from '../../app/utils/types'

const DEFAULT_SETTINGS: UserSettings = {
  time10k: 2400,
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

describe('basePaceSec', () => {
  it('deriva el ritmo base de la marca de 10K', () => {
    expect(basePaceSec(2400)).toBe(240) // 40:00 → 4:00/km
    expect(basePaceSec(1800)).toBe(180) // 30:00 → 3:00/km
    expect(basePaceSec(3600)).toBe(360) // 60:00 → 6:00/km
  })
})

describe('pace', () => {
  it('aplica el offset sobre la base y el multiplicador de energía', () => {
    // base 240 + warmup 60 = 300, energía normal (mult 1.0)
    expect(pace(240, 'warmup', 1.0)).toBe(300)
    // base 240 + recovery 70 = 310
    expect(pace(240, 'recovery', 1.0)).toBe(310)
    // fresco (mult 0.98): (240 + 60) * 0.98 = 294
    expect(pace(240, 'warmup', 0.98)).toBe(294)
  })
})

describe('energyFromIndex', () => {
  it('devuelve el nivel por índice', () => {
    expect(energyFromIndex(DEFAULT_SETTINGS, ENERGY_LEVELS).label).toBe('NORMAL')
    expect(energyFromIndex({ ...DEFAULT_SETTINGS, energyIndex: 0 }, ENERGY_LEVELS).label).toBe('FRESCO')
    expect(energyFromIndex({ ...DEFAULT_SETTINGS, energyIndex: 2 }, ENERGY_LEVELS).label).toBe('CANSADO')
  })

  it('clampa índices fuera de rango a NORMAL', () => {
    expect(energyFromIndex({ ...DEFAULT_SETTINGS, energyIndex: 99 }, ENERGY_LEVELS).label).toBe('NORMAL')
    expect(energyFromIndex({ ...DEFAULT_SETTINGS, energyIndex: -3 }, ENERGY_LEVELS).label).toBe('NORMAL')
  })
})

describe('buildPlan', () => {
  it('devuelve null para misión inexistente', () => {
    expect(buildPlan(null, DEFAULT_SETTINGS)).toBeNull()
  })

  // Valores de referencia calculados del motor original (settings por defecto)
  const refs: Record<string, { totalKm: number; totalSec: number; steps: number }> = {
    regenerar: { totalKm: 6.667, totalSec: 2400, steps: 2 },
    suave: { totalKm: 10.584, totalSec: 3084, steps: 3 },
    series: { totalKm: 10.225, totalSec: 2715.6, steps: 3 },
    tempo: { totalKm: 8.736, totalSec: 2400, steps: 3 },
    fartlek: { totalKm: 7.815, totalSec: 2190, steps: 3 },
    'tirada-larga': { totalKm: 13.984, totalSec: 4140, steps: 3 },
    progresiva: { totalKm: 13.574, totalSec: 3836.667, steps: 3 },
    cuestas: { totalKm: 9.523, totalSec: 2820, steps: 3 },
    piramide: { totalKm: 10.433, totalSec: 2820, steps: 3 },
    cacos: { totalKm: 8.79, totalSec: 2340, steps: 3 },
  }

  for (const mission of MISSIONS) {
    it(`genera el plan de "${mission.key}" con los valores de referencia`, () => {
      const plan = buildPlan(mission, DEFAULT_SETTINGS)
      expect(plan).not.toBeNull()
      expect(plan!.steps).toHaveLength(refs[mission.key]!.steps)
      expect(plan!.totalKm).toBeCloseTo(refs[mission.key]!.totalKm, 2)
      expect(plan!.totalSec).toBeCloseTo(refs[mission.key]!.totalSec, 1)
    })
  }

  it('incluye el consejo y la misión de origen en el plan', () => {
    const suave = MISSIONS.find(m => m.key === 'suave')!
    const plan = buildPlan(suave, DEFAULT_SETTINGS)
    expect(plan!.mission.key).toBe('suave')
    expect(plan!.tip).toBeTruthy()
  })

  it('la energía afecta a los ritmos del plan', () => {
    const suave = MISSIONS.find(m => m.key === 'suave')!
    const fresco = buildPlan(suave, { ...DEFAULT_SETTINGS, energyIndex: 0 })!
    const normal = buildPlan(suave, DEFAULT_SETTINGS)!
    // fresco es ~2% más rápido → menos tiempo total
    expect(fresco.totalSec).toBeLessThan(normal.totalSec)
  })

  it('genera un paso EXTRA en regenerar (movilidad)', () => {
    const regen = MISSIONS.find(m => m.key === 'regenerar')!
    const plan = buildPlan(regen, DEFAULT_SETTINGS)!
    expect(plan.steps.some(s => s.tag === 'EXTRA')).toBe(true)
  })

  describe('hills (fix US4)', () => {
    const cuestas = MISSIONS.find(m => m.key === 'cuestas')!

    it('incluye el trabajo de subida en la distancia total', () => {
      const plan = buildPlan(cuestas, DEFAULT_SETTINGS)!
      const hillsStep = plan.steps.find(s => s.label === 'Bloque de cuestas')!
      // Con 8 reps × 60s y rec ×2: subida = 480s, bajada = 840s
      // work_pace (base 240 + 20) = 260 s/km → 480/260 ≈ 1.846 km
      // rec_pace (recovery 310) → 840/310 ≈ 2.710 km
      // Total bloque ≈ 4.556 km (antes solo 2.710)
      expect(hillsStep.km).toBeGreaterThan(2.71)
      expect(hillsStep.km).toBeCloseTo(4.556, 2)
    })

    it('la distancia total del plan es coherente con el tiempo', () => {
      const plan = buildPlan(cuestas, DEFAULT_SETTINGS)!
      expect(plan.totalKm).toBeGreaterThan(0)
      expect(plan.totalSec).toBeGreaterThan(0)
      // tiempo / ritmo plausible → sin NaN ni valores absurdos
      expect(plan.totalKm).toBeLessThan(plan.totalSec / 180) // nunca más de 3:00/km
      expect(Number.isFinite(plan.totalKm)).toBe(true)
    })

    it('no produce valores negativos ni NaN en los límites', () => {
      const limites = [
        { hillReps: 4, hillDuration: 45 },
        { hillReps: 12, hillDuration: 90 },
      ]
      for (const l of limites) {
        const plan = buildPlan(cuestas, { ...DEFAULT_SETTINGS, ...l })!
        expect(Number.isFinite(plan.totalKm)).toBe(true)
        expect(plan.totalKm).toBeGreaterThan(0)
        expect(Number.isFinite(plan.totalSec)).toBe(true)
        expect(plan.totalSec).toBeGreaterThan(0)
      }
    })

    it('responde a la energía del día', () => {
      const fresco = buildPlan(cuestas, { ...DEFAULT_SETTINGS, energyIndex: 0 })!
      const cansado = buildPlan(cuestas, { ...DEFAULT_SETTINGS, energyIndex: 2 })!
      // El tiempo de cuestas es esfuerzo por tiempo (fijo), pero la distancia
      // estimada depende de los ritmos → cansado (más lento) recorre menos km
      expect(cansado.totalKm).toBeLessThan(fresco.totalKm)
    })
  })
})
