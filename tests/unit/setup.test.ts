import { describe, it, expect } from 'vitest'
import { computed, reactive } from 'vue'
import { useRunArcadeSetup } from '../../app/composables/useRunArcadeSetup'
import { DEFAULT_SETTINGS } from '../../app/utils/settings'
import { MISSIONS } from '../../app/utils/missions'
import { basePaceSec } from '../../app/utils/pace'

function createSetup() {
  const state = reactive({ ...DEFAULT_SETTINGS })
  const catalog = computed(() => MISSIONS)
  return { state, ...useRunArcadeSetup(state, catalog) }
}

describe('selectLevel (nivel → marca)', () => {
  it('fija la marca 10K al preset y marca el nivel como activo', () => {
    const { state, selectLevel } = createSetup()

    selectLevel('elite')
    expect(state.time10k).toBe(1800)
    expect(state.levelKey).toBe('elite')

    selectLevel('facil')
    expect(state.time10k).toBe(2700)
    expect(state.levelKey).toBe('facil')
  })

  it('ignora claves de nivel inexistentes sin tocar el estado', () => {
    const { state, selectLevel } = createSetup()
    const before = state.time10k
    selectLevel('extremo' as never)
    expect(state.time10k).toBe(before)
  })
})

describe('step en time10k (marca → nivel más cercano)', () => {
  it('mantiene el nivel al afinar ligeramente la marca', () => {
    const { state, selectLevel, stepBaseTime } = createSetup()
    selectLevel('elite')
    stepBaseTime(1)
    expect(state.time10k).toBe(1830)
    expect(state.levelKey).toBe('elite')
  })

  it('salta al siguiente nivel al cruzar el punto medio entre presets', () => {
    const { state, selectLevel, stepBaseTime } = createSetup()
    selectLevel('elite') // 1800
    // 6 pulsaciones ▶: 1980 s → más cerca de avanzado (2100) que de élite (1800)
    for (let i = 0; i < 6; i++) stepBaseTime(1)
    expect(state.time10k).toBe(1980)
    expect(state.levelKey).toBe('avanzado')
  })

  it('no altera el nivel al afinar otros parámetros', () => {
    const { state, selectLevel, step } = createSetup()
    selectLevel('avanzado')
    step('seriesReps', 1)
    expect(state.levelKey).toBe('avanzado')
    expect(state.time10k).toBe(2100)
  })
})

describe('recálculo reactivo de la foto rápida', () => {
  it('el plan de una misión refleja al instante el ritmo del nivel seleccionado', () => {
    const { state, selectMission, selectLevel, plan } = createSetup()
    selectMission('tempo')
    selectLevel('elite') // 30:00 → ritmo base 3:00/km

    expect(plan.value).not.toBeNull()
    const main = plan.value!.steps.find((s) => s.label === 'Bloque tempo continuo')
    expect(main?.pace).toBe(basePaceSec(1800) + 12) // base 180 + offset tempo 12
  })
})
