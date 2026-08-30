/* ============================================================================
   RUN·ARCADE — Estado reactivo y persistencia
   ----------------------------------------------------------------------------
   Estado global de configuración del usuario + misiones personalizadas.
   Persistencia versionada (v2) con migración v1 y debounce en utils/persistence.
   ============================================================================ */

import { DEFAULT_SETTINGS } from '../utils/settings'
import { MISSIONS } from '../utils/missions'
import { mergeCatalog, readPersisted, writePersisted } from '../utils/persistence'
import type { Mission, UserSettings } from '../utils/types'

/** Estado por defecto (clonado para no compartir referencia). */
function defaultState(): UserSettings {
  return { ...DEFAULT_SETTINGS }
}

/** Debounce para la persistencia (evita escribir en cada keystroke). */
function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  return ((...args: unknown[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }) as T
}

export function useRunArcadeState() {
  const state = reactive<UserSettings>(defaultState())
  const customMissions = ref<Mission[]>([])
  const loaded = ref(false)

  /** Catálogo visible = misiones base del código + personalizadas del usuario. */
  const catalog = computed<Mission[]>(() => mergeCatalog(MISSIONS, customMissions.value))

  /** Guardado debounced (400ms) del estado v2. */
  const saveState = debounce(() => {
    writePersisted({ version: 2, settings: { ...state }, customMissions: customMissions.value })
  }, 400)

  /** Carga segura desde localStorage (migra v1→v2 y clampa valores). */
  function loadFromStorage() {
    const persisted = readPersisted()
    Object.assign(state, persisted.settings)
    customMissions.value = persisted.customMissions
    loaded.value = true
  }

  /** Persiste tras el primer cambio del usuario (no en la carga inicial). */
  watch(
    [state, customMissions],
    () => {
      if (!loaded.value) return
      saveState()
    },
    { deep: true },
  )

  function addCustomMission(mission: Mission) {
    customMissions.value.push(mission)
  }

  function deleteCustomMission(key: string) {
    if (!key.startsWith('custom_')) return
    const index = customMissions.value.findIndex((m) => m.key === key)
    if (index !== -1) customMissions.value.splice(index, 1)
  }

  if (import.meta.client) {
    onMounted(loadFromStorage)
  }

  return { state, customMissions, catalog, addCustomMission, deleteCustomMission, loadFromStorage }
}
