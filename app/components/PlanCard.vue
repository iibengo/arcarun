<script setup lang="ts">
/* ============================================================================
   RUN·ARCADE — Foto rápida (tarjeta resumen para captura)
   ============================================================================ */

import { fmtDuration, fmtKm, fmtPace } from '../utils/formatters'
import type { EnergyLevel, RunPlan } from '../utils/types'

defineProps<{
  plan: RunPlan
  energy: EnergyLevel
}>()
</script>

<template>
  <div
    class="rounded-2xl border-2 bg-panel-2 p-4"
    :style="{ borderColor: plan.mission.hex + '66', boxShadow: `0 0 24px ${plan.mission.hex}22` }"
  >
    <!-- Cabecera de la tarjeta -->
    <div class="mb-3 flex items-center justify-between border-b border-line pb-3">
      <div class="leading-tight">
        <p class="text-[9px] tracking-[0.3em] text-muted">MISIÓN DE HOY</p>
        <p class="font-display text-base font-black" :style="{ color: plan.mission.hex }">
          {{ plan.mission.name }}
        </p>
      </div>
      <div class="text-right leading-tight">
        <p class="text-[9px] tracking-[0.3em] text-muted">ENERGÍA</p>
        <p class="font-display text-sm font-bold" :style="{ color: energy.hex }">{{ energy.label }}</p>
      </div>
    </div>

    <!-- Métricas destacadas -->
    <div class="mb-4 grid grid-cols-2 gap-2">
      <div class="rounded-xl border border-line bg-oled px-3 py-2.5 text-center">
        <p class="text-[9px] tracking-[0.25em] text-muted">DISTANCIA</p>
        <p class="font-display text-2xl font-black text-ink">{{ fmtKm(plan.totalKm) }}</p>
      </div>
      <div class="rounded-xl border border-line bg-oled px-3 py-2.5 text-center">
        <p class="text-[9px] tracking-[0.25em] text-muted">TIEMPO EST.</p>
        <p class="font-display text-2xl font-black text-ink">≈{{ fmtDuration(plan.totalSec) }}</p>
      </div>
    </div>

    <!-- Desglose paso a paso -->
    <div class="mb-4 flex flex-col gap-2">
      <p class="text-[9px] tracking-[0.3em] text-muted">PLAN DE VUELO</p>
      <div
        v-for="(s, i) in plan.steps"
        :key="i"
        class="flex items-center gap-3 rounded-lg border border-line bg-oled px-3 py-2"
      >
        <span
          class="grid h-6 w-6 shrink-0 place-items-center rounded-md font-display text-[10px] font-black text-oled"
          :style="{ background: s.hex }"
        >
          {{ i + 1 }}
        </span>
        <div class="flex-1 leading-tight">
          <p class="text-[13px] font-bold text-ink">{{ s.label }}</p>
          <p class="text-[10px] text-muted">{{ s.meta }}</p>
        </div>
        <div v-if="s.pace" class="text-right leading-tight">
          <p class="font-display text-sm font-bold" :style="{ color: s.hex }">{{ fmtPace(s.pace) }}</p>
          <p class="text-[9px] text-muted">
            /km<template v-if="s.recPace"> · rec {{ fmtPace(s.recPace) }}</template>
          </p>
        </div>
        <div v-else-if="s.recPace" class="text-right leading-tight">
          <p class="font-display text-sm font-bold" :style="{ color: s.hex }">{{ fmtPace(s.recPace) }}</p>
          <p class="text-[9px] text-muted">Ritmo rec.</p>
        </div>
      </div>
    </div>

    <!-- Consejo del entrenador (cuadro de diálogo de videojuego) -->
    <div class="relative rounded-lg border-2 border-neon-yellow bg-oled p-3">
      <span
        class="absolute -top-2 left-3 bg-panel-2 px-2 text-[9px] font-bold tracking-[0.2em] text-neon-yellow"
      >
        COACH ►
      </span>
      <p class="text-[12px] leading-relaxed text-ink">
        {{ plan.tip }}<span class="blink text-neon-yellow"> ▮</span>
      </p>
    </div>
  </div>
</template>
