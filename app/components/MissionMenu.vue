<script setup lang="ts">
/* ============================================================================
   RUN·ARCADE — Menú principal (SELECT MISSION)
   ============================================================================ */

import { fmtPace, levelLabel } from '../utils/formatters'
import { ENERGY_LEVELS } from '../utils/missions'
import { LEVELS } from '../utils/levels'
import type { EnergyLevel, LevelKey, Mission, UserSettings } from '../utils/types'

defineProps<{
  catalog: Mission[]
  settings: UserSettings
  energy: EnergyLevel
}>()

const emit = defineEmits<{
  select: [key: string]
  create: []
  deleteMission: [key: string]
  stepBaseTime: [dir: -1 | 1]
  shiftEnergy: [dir: -1 | 1]
  selectLevel: [key: LevelKey]
}>()

/** Estilo arcade de tarjeta de nivel: activo → borde neón + glow, inactivo → línea. */
function levelCardStyle(active: boolean, hex: string) {
  return active
    ? { borderColor: hex, boxShadow: `0 0 12px ${hex}66` }
    : { borderColor: '#232b38', boxShadow: 'none' }
}
</script>

<template>
  <div class="p-4">
    <div class="mb-3 flex items-center justify-between">
      <h1 class="font-display text-lg font-black tracking-wider text-ink">
        SELECT<span class="text-neon-green"> MISSION</span>
      </h1>
      <button
        @click="emit('create')"
        class="press grid h-8 w-8 place-items-center rounded-md border-2 border-line bg-panel text-2xl font-black text-neon-green"
        aria-label="Crear nueva misión"
      >
        +
      </button>
    </div>

    <!-- Selección de nivel predeterminado (presets de marca 10K) -->
    <div class="mb-4">
      <span class="text-[10px] tracking-[0.25em] text-muted">NIVEL</span>
      <div class="mt-1.5 grid grid-cols-4 gap-1.5" role="group" aria-label="Nivel predeterminado">
        <button
          v-for="lvl in LEVELS"
          :key="lvl.key"
          class="press flex flex-col items-center gap-0.5 rounded-lg border-2 bg-panel-2 px-1 py-2 transition-colors"
          :style="levelCardStyle(settings.levelKey === lvl.key, lvl.hex)"
          :aria-pressed="settings.levelKey === lvl.key"
          @click="emit('selectLevel', lvl.key)"
        >
          <span class="font-display text-[11px] font-black leading-none tracking-wide" :style="{ color: lvl.hex }">
            {{ lvl.label }}
          </span>
          <span class="text-[9px] leading-none text-muted">{{ fmtPace(lvl.time10k) }}</span>
        </button>
      </div>
    </div>

    <!-- Ajuste rápido del nivel (marca de 10K) -->
    <div class="mb-4 flex items-center justify-between rounded-lg border border-line bg-panel-2 px-3 py-2">
      <span class="text-[10px] tracking-[0.2em] text-muted">MARCA 10K</span>
      <div class="flex items-center gap-3">
        <button
          class="press grid h-7 w-7 place-items-center rounded-md border border-line bg-panel text-ink"
          @click="emit('stepBaseTime', -1)"
          aria-label="Bajar marca de 10K"
        >
          ◀
        </button>
        <span class="w-16 text-center font-display text-base font-bold text-neon-green">
          {{ fmtPace(settings.time10k) }}
        </span>
        <button
          class="press grid h-7 w-7 place-items-center rounded-md border border-line bg-panel text-ink"
          @click="emit('stepBaseTime', 1)"
          aria-label="Subir marca de 10K"
        >
          ▶
        </button>
      </div>
    </div>

    <!-- Botones de misión tipo menú de juego -->
    <div class="grid grid-cols-3 gap-3" role="menu" aria-label="Tipos de entrenamiento">
      <div v-for="m in catalog" :key="m.key" role="none" class="relative">
        <button
          role="menuitem"
          class="press group flex h-36 w-full flex-col items-center justify-start gap-2 rounded-xl border-2 bg-panel-2 px-2 py-3 text-center transition-colors"
          :style="{
            borderColor: m.hex + '55',
            boxShadow: `4px 4px 0 0 ${m.hex}22`,
          }"
          @click="emit('select', m.key)"
        >
          <span
            class="grid h-12 w-12 shrink-0 place-items-center rounded-lg border text-2xl"
            :style="{ borderColor: m.hex + '66', background: m.hex + '14' }"
            aria-hidden="true"
          >
            {{ m.icon }}
          </span>
          <span class="flex h-14 flex-col justify-center leading-tight">
            <span class="font-display text-sm font-bold tracking-wide" :style="{ color: m.hex }">
              {{ m.name }}
            </span>
            <span class="text-[9px] text-muted">{{ m.sub }}</span>
          </span>
        </button>
        <button
          v-if="m.key.startsWith('custom_')"
          @click.stop="emit('deleteMission', m.key)"
          class="absolute top-2 right-2 h-6 w-6 bg-neon-red text-oled rounded-full text-xs font-bold"
          aria-label="Borrar misión"
        >
          X
        </button>
      </div>
    </div>

    <!-- Control de Energía / Fatiga de hoy -->
    <div class="mt-4 rounded-xl border border-line bg-panel-2 p-3">
      <div class="mb-2 flex items-center justify-between">
        <span class="text-[10px] tracking-[0.25em] text-muted">ENERGÍA DE HOY</span>
        <span class="text-[10px]" :style="{ color: energy.hex }">{{ energy.note }}</span>
      </div>
      <div class="flex items-center gap-3">
        <button
          class="press grid h-10 w-10 place-items-center rounded-lg border-2 border-line bg-panel text-ink disabled:opacity-30"
          :disabled="settings.energyIndex === 0"
          @click="emit('shiftEnergy', -1)"
          aria-label="Más fresco"
        >
          ◀
        </button>
        <div class="flex flex-1 items-center gap-1.5">
          <span
            v-for="(lvl, i) in ENERGY_LEVELS"
            :key="lvl.key"
            class="h-2 flex-1 rounded-full transition-all"
            :style="{
              background: i <= settings.energyIndex ? energy.hex : '#232b38',
              boxShadow: i <= settings.energyIndex ? `0 0 8px ${energy.hex}` : 'none',
            }"
            aria-hidden="true"
          />
        </div>
        <button
          class="press grid h-10 w-10 place-items-center rounded-lg border-2 border-line bg-panel text-ink disabled:opacity-30"
          :disabled="settings.energyIndex === ENERGY_LEVELS.length - 1"
          @click="emit('shiftEnergy', 1)"
          aria-label="Más cansado"
        >
          ▶
        </button>
      </div>
      <p class="mt-2 text-center font-display text-sm font-bold tracking-wide" :style="{ color: energy.hex }">
        {{ energy.label }}
      </p>
    </div>

    <p class="mt-3 text-center text-[10px] text-muted" aria-hidden="true">{{ levelLabel(settings.time10k) }}</p>
  </div>
</template>
