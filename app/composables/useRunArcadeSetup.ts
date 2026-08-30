/* ============================================================================
   RUN·ARCADE — Navegación y configuración de la misión activa
   ----------------------------------------------------------------------------
   Orquesta vista, misión seleccionada, steppers de parámetros y el plan
   generado por el motor de ritmos. Sin lógica de cálculo inline.
   ============================================================================ */

import { computed, ref } from 'vue'
import { buildPlan, energyFromIndex } from '../utils/pace'
import { ENERGY_LEVELS, PREDEFINED_COLORS } from '../utils/missions'
import { levelByKey, nearestLevel } from '../utils/levels'
import { SETTINGS_RANGES, SERIES_DISTANCES, HILL_DURATIONS } from '../utils/settings'
import type { LevelKey, Mission, NumericStateKey, StateKey, UserSettings } from '../utils/types'

type ViewName = 'menu' | 'create' | 'setup'

export function useRunArcadeSetup(state: UserSettings, catalog: ComputedRef<Mission[]>) {
  const view = ref<ViewName>('menu')
  const missionKey = ref<string | null>(null)
  const newMissionData = ref<Mission | null>(null)
  const launched = ref(false)

  const activeMission = computed<Mission | null>(
    () => catalog.value.find((m) => m.key === missionKey.value) ?? null,
  )

  const energy = computed(() => energyFromIndex(state))

  /** Plan generado solo cuando se está en la vista de setup. */
  const plan = computed(() => {
    if (view.value !== 'setup') return null
    return buildPlan(activeMission.value, state)
  })

  /* ------------------------------------------------------------------------ */
  /*  Steppers                                                                */
  /* ------------------------------------------------------------------------ */

  function step(key: StateKey, dir: -1 | 1) {
    if (key === 'levelKey') return
    const range = SETTINGS_RANGES[key]
    if (!range) return
    const next = state[key] + dir * range.step
    if (next >= range.min && next <= range.max) {
      state[key] = next
      // Sincronización bidireccional: al afinar la marca, el nivel activo
      // sigue al preset más cercano.
      if (key === 'time10k') state.levelKey = nearestLevel(state.time10k).key
    }
  }

  /** Aplica un preset de nivel: fija la marca 10K y el nivel activo. */
  function selectLevel(key: LevelKey) {
    const preset = levelByKey(key)
    if (!preset) return
    state.levelKey = preset.key
    state.time10k = preset.time10k
  }

  /** Cicla por una lista de valores discretos (seriesDist, hillDuration). */
  function cycleFromList(key: NumericStateKey, dir: -1 | 1, options: number[]) {
    const current = state[key]
    const i = options.indexOf(current)
    const n = i + dir
    if (n >= 0 && n < options.length) state[key] = options[n]!
  }

  function cycleSeriesDist(dir: -1 | 1) {
    cycleFromList('seriesDist', dir, SERIES_DISTANCES)
  }

  function cycleHillDuration(dir: -1 | 1) {
    cycleFromList('hillDuration', dir, HILL_DURATIONS)
  }

  function shiftEnergy(dir: -1 | 1) {
    const next = state.energyIndex + dir
    if (next >= 0 && next < ENERGY_LEVELS.length) state.energyIndex = next
  }

  function stepBaseTime(dir: -1 | 1) {
    step('time10k', dir)
  }

  /* ------------------------------------------------------------------------ */
  /*  Navegación                                                              */
  /* ------------------------------------------------------------------------ */

  function selectMission(key: string) {
    missionKey.value = key
    view.value = 'setup'
  }

  function backToMenu() {
    view.value = 'menu'
    missionKey.value = null
  }

  function showCreateForm() {
    newMissionData.value = {
      key: `custom_${Date.now()}`,
      name: 'Carrera',
      sub: 'A medida',
      icon: '👟',
      hex: PREDEFINED_COLORS[Math.floor(Math.random() * PREDEFINED_COLORS.length)]!,
      tip: '¡Buen entrenamiento!',
      type: 'custom',
      planConfig: {
        blocks: [
          { type: 'warmup', unit: 'duration', value: 10 },
          { type: 'run', label: 'Carrera', metaTemplate: '{value} km', value: 5, unit: 'distance', offset: 50 },
          { type: 'cooldown', unit: 'duration', value: 5 },
        ],
      },
    }
    view.value = 'create'
  }

  function cycleNewMissionColor() {
    const current = newMissionData.value
    if (!current) return
    const i = PREDEFINED_COLORS.indexOf(current.hex)
    const next = (i + 1) % PREDEFINED_COLORS.length
    current.hex = PREDEFINED_COLORS[next]!
  }

  /** Inserta un bloque de carrera antes del enfriamiento (último bloque). */
  function addBlockToCustomMission() {
    const data = newMissionData.value
    if (!data) return
    const blocks = data.planConfig.blocks
    blocks.splice(blocks.length - 1, 0, {
      type: 'run',
      label: 'Nuevo Bloque',
      metaTemplate: '{value} km',
      value: 3,
      unit: 'distance',
      offset: 60,
    })
  }

  function removeBlockFromCustomMission(index: number) {
    const data = newMissionData.value
    if (!data) return
    if (data.planConfig.blocks.length > 1) data.planConfig.blocks.splice(index, 1)
  }

  function saveNewMission(save: (mission: Mission) => void) {
    if (!newMissionData.value) return
    save(JSON.parse(JSON.stringify(newMissionData.value)) as Mission)
    view.value = 'menu'
  }

  function cancelCreate() {
    view.value = 'menu'
    newMissionData.value = null
  }

  /** Overlay arcade "READY?" (2.2s). */
  function launch() {
    launched.value = true
    setTimeout(() => (launched.value = false), 2200)
  }

  return {
    view,
    missionKey,
    newMissionData,
    launched,
    activeMission,
    energy,
    plan,
    step,
    cycleSeriesDist,
    cycleHillDuration,
    shiftEnergy,
    stepBaseTime,
    selectLevel,
    selectMission,
    backToMenu,
    showCreateForm,
    cycleNewMissionColor,
    addBlockToCustomMission,
    removeBlockFromCustomMission,
    saveNewMission,
    cancelCreate,
    launch,
  }
}
