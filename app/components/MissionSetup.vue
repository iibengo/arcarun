<script setup lang="ts">
/* ============================================================================
   RUN·ARCADE — Setup de misión (controles + foto rápida + acciones)
   ============================================================================ */

import type { EnergyLevel, PlanStep, RunPlan, UserSettings } from '../utils/types'

defineProps<{
  plan: RunPlan
  settings: UserSettings
  energy: EnergyLevel
  missionKey: string | null
  launched: boolean
}>()

const emit = defineEmits<{
  back: []
  launch: []
  step: [key: string, dir: -1 | 1]
  cycleSeriesDist: [dir: -1 | 1]
  cycleHillDuration: [dir: -1 | 1]
}>()

type StepHandler = (dir: -1 | 1) => void

/** Paso del plan para tipado en el template. */
</script>

<template>
  <div class="p-4">
    <!-- Cabecera de misión -->
    <div class="mb-3 flex items-center gap-3">
      <span
        class="grid h-11 w-11 place-items-center rounded-lg border text-xl"
        :style="{ borderColor: plan.mission.hex + '66', background: plan.mission.hex + '14' }"
        aria-hidden="true"
      >
        {{ plan.mission.icon }}
      </span>
      <div class="leading-tight">
        <h2 class="font-display text-lg font-black tracking-wide" :style="{ color: plan.mission.hex }">
          {{ plan.mission.name }}
        </h2>
        <p class="text-[11px] text-muted">{{ plan.mission.sub }}</p>
      </div>
    </div>

    <!-- Controles de setup (según misión) -->
    <div class="mb-4 flex flex-col gap-2">
      <!-- SERIES: reps + distancia -->
      <template v-if="missionKey === 'series'">
        <div class="flex items-center justify-between rounded-lg border border-line bg-panel-2 px-3 py-2">
          <span class="text-[10px] tracking-[0.2em] text-muted">Nº SERIES</span>
          <div class="flex items-center gap-3">
            <button class="press ctrl-btn" @click="emit('step', 'seriesReps', -1)" aria-label="Menos series">◀</button>
            <span class="w-10 text-center font-display text-base font-bold text-ink">{{ settings.seriesReps }}</span>
            <button class="press ctrl-btn" @click="emit('step', 'seriesReps', 1)" aria-label="Más series">▶</button>
          </div>
        </div>
        <div class="flex items-center justify-between rounded-lg border border-line bg-panel-2 px-3 py-2">
          <span class="text-[10px] tracking-[0.2em] text-muted">DISTANCIA</span>
          <div class="flex items-center gap-3">
            <button class="press ctrl-btn" @click="emit('cycleSeriesDist', -1)" aria-label="Menos distancia">◀</button>
            <span class="w-16 text-center font-display text-base font-bold text-ink">{{ settings.seriesDist }}m</span>
            <button class="press ctrl-btn" @click="emit('cycleSeriesDist', 1)" aria-label="Más distancia">▶</button>
          </div>
        </div>
      </template>

      <!-- TEMPO: minutos -->
      <div
        v-else-if="missionKey === 'tempo'"
        class="flex items-center justify-between rounded-lg border border-line bg-panel-2 px-3 py-2"
      >
        <span class="text-[10px] tracking-[0.2em] text-muted">MIN A UMBRAL</span>
        <div class="flex items-center gap-3">
          <button class="press ctrl-btn" @click="emit('step', 'tempoMin', -1)" aria-label="Menos minutos">◀</button>
          <span class="w-12 text-center font-display text-base font-bold text-ink">{{ settings.tempoMin }}'</span>
          <button class="press ctrl-btn" @click="emit('step', 'tempoMin', 1)" aria-label="Más minutos">▶</button>
        </div>
      </div>

      <!-- SUAVE: km -->
      <div
        v-else-if="missionKey === 'suave'"
        class="flex items-center justify-between rounded-lg border border-line bg-panel-2 px-3 py-2"
      >
        <span class="text-[10px] tracking-[0.2em] text-muted">DISTANCIA</span>
        <div class="flex items-center gap-3">
          <button class="press ctrl-btn" @click="emit('step', 'aerobicKm', -1)" aria-label="Menos km">◀</button>
          <span class="w-14 text-center font-display text-base font-bold text-ink">{{ settings.aerobicKm }} km</span>
          <button class="press ctrl-btn" @click="emit('step', 'aerobicKm', 1)" aria-label="Más km">▶</button>
        </div>
      </div>

      <!-- REGENERAR: minutos -->
      <div
        v-else-if="missionKey === 'regenerar'"
        class="flex items-center justify-between rounded-lg border border-line bg-panel-2 px-3 py-2"
      >
        <span class="text-[10px] tracking-[0.2em] text-muted">DURACIÓN</span>
        <div class="flex items-center gap-3">
          <button class="press ctrl-btn" @click="emit('step', 'regenMin', -1)" aria-label="Menos minutos">◀</button>
          <span class="w-14 text-center font-display text-base font-bold text-ink">{{ settings.regenMin }}'</span>
          <button class="press ctrl-btn" @click="emit('step', 'regenMin', 1)" aria-label="Más minutos">▶</button>
        </div>
      </div>

      <!-- FARTLEK: reps -->
      <div
        v-else-if="missionKey === 'fartlek'"
        class="flex items-center justify-between rounded-lg border border-line bg-panel-2 px-3 py-2"
      >
        <span class="text-[10px] tracking-[0.2em] text-muted">Nº CAMBIOS</span>
        <div class="flex items-center gap-3">
          <button class="press ctrl-btn" @click="emit('step', 'fartlekReps', -1)" aria-label="Menos cambios">◀</button>
          <span class="w-10 text-center font-display text-base font-bold text-ink">{{ settings.fartlekReps }}</span>
          <button class="press ctrl-btn" @click="emit('step', 'fartlekReps', 1)" aria-label="Más cambios">▶</button>
        </div>
      </div>

      <!-- CACOS: reps -->
      <div
        v-else-if="missionKey === 'cacos'"
        class="flex items-center justify-between rounded-lg border border-line bg-panel-2 px-3 py-2"
      >
        <span class="text-[10px] tracking-[0.2em] text-muted">Nº REPETICIONES</span>
        <div class="flex items-center gap-3">
          <button class="press ctrl-btn" @click="emit('step', 'cacosReps', -1)" aria-label="Menos repeticiones">◀</button>
          <span class="w-10 text-center font-display text-base font-bold text-ink">{{ settings.cacosReps }}</span>
          <button class="press ctrl-btn" @click="emit('step', 'cacosReps', 1)" aria-label="Más repeticiones">▶</button>
        </div>
      </div>

      <!-- TIRADA LARGA: km -->
      <div
        v-else-if="missionKey === 'tirada-larga'"
        class="flex items-center justify-between rounded-lg border border-line bg-panel-2 px-3 py-2"
      >
        <span class="text-[10px] tracking-[0.2em] text-muted">DISTANCIA</span>
        <div class="flex items-center gap-3">
          <button class="press ctrl-btn" @click="emit('step', 'longRunKm', -1)" aria-label="Menos km">◀</button>
          <span class="w-14 text-center font-display text-base font-bold text-ink">{{ settings.longRunKm }} km</span>
          <button class="press ctrl-btn" @click="emit('step', 'longRunKm', 1)" aria-label="Más km">▶</button>
        </div>
      </div>

      <!-- PROGRESIVA: km -->
      <div
        v-else-if="missionKey === 'progresiva'"
        class="flex items-center justify-between rounded-lg border border-line bg-panel-2 px-3 py-2"
      >
        <span class="text-[10px] tracking-[0.2em] text-muted">DISTANCIA</span>
        <div class="flex items-center gap-3">
          <button class="press ctrl-btn" @click="emit('step', 'progressiveKm', -1)" aria-label="Menos km">◀</button>
          <span class="w-14 text-center font-display text-base font-bold text-ink">{{ settings.progressiveKm }} km</span>
          <button class="press ctrl-btn" @click="emit('step', 'progressiveKm', 1)" aria-label="Más km">▶</button>
        </div>
      </div>

      <!-- CUESTAS: reps + duración -->
      <template v-if="missionKey === 'cuestas'">
        <div class="flex items-center justify-between rounded-lg border border-line bg-panel-2 px-3 py-2">
          <span class="text-[10px] tracking-[0.2em] text-muted">Nº REPETICIONES</span>
          <div class="flex items-center gap-3">
            <button class="press ctrl-btn" @click="emit('step', 'hillReps', -1)" aria-label="Menos repeticiones">◀</button>
            <span class="w-10 text-center font-display text-base font-bold text-ink">{{ settings.hillReps }}</span>
            <button class="press ctrl-btn" @click="emit('step', 'hillReps', 1)" aria-label="Más repeticiones">▶</button>
          </div>
        </div>
        <div class="flex items-center justify-between rounded-lg border border-line bg-panel-2 px-3 py-2">
          <span class="text-[10px] tracking-[0.2em] text-muted">DURACIÓN</span>
          <div class="flex items-center gap-3">
            <button class="press ctrl-btn" @click="emit('cycleHillDuration', -1)" aria-label="Menos duración">◀</button>
            <span class="w-16 text-center font-display text-base font-bold text-ink">{{ settings.hillDuration }}s</span>
            <button class="press ctrl-btn" @click="emit('cycleHillDuration', 1)" aria-label="Más duración">▶</button>
          </div>
        </div>
      </template>
    </div>

    <!-- La foto rápida -->
    <PlanCard :plan="plan" :energy="energy" />

    <!-- Botones de acción final -->
    <div class="mt-4 grid grid-cols-2 gap-3">
      <button
        class="press flex items-center justify-center gap-2 rounded-xl border-2 border-line bg-panel-2 py-3 font-display text-sm font-bold tracking-wide text-ink"
        :style="{ boxShadow: '4px 4px 0 0 #232b38' }"
        @click="emit('back')"
      >
        🔄 AJUSTAR
      </button>
      <button
        class="press flex items-center justify-center gap-2 rounded-xl border-2 py-3 font-display text-sm font-black tracking-wide text-oled"
        :style="{
          background: plan.mission.hex,
          borderColor: plan.mission.hex,
          boxShadow: `4px 4px 0 0 ${plan.mission.hex}55`,
        }"
        @click="emit('launch')"
      >
        🚀 ¡A JUGAR!
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Botón de control compacto reutilizable (◀ ▶) */
.ctrl-btn {
  display: grid;
  place-items: center;
  height: 1.9rem;
  width: 1.9rem;
  border-radius: 0.375rem;
  border: 1px solid var(--color-line);
  background: var(--color-panel);
  color: var(--color-ink);
}
</style>
