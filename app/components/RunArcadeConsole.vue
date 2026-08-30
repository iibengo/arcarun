<script setup lang="ts">
/* ============================================================================
   RUN·ARCADE — Carcasa de la consola (CRT) + orquestación de vistas
   ----------------------------------------------------------------------------
   Componente raíz de la app: gestiona el estado global y compone las vistas
   según la autenticación y la vista activa.
   ============================================================================ */

import { useRunArcadeAuth } from '../composables/useRunArcadeAuth'
import { useRunArcadeSetup } from '../composables/useRunArcadeSetup'
import { useRunArcadeState } from '../composables/useRunArcadeState'

const { isAuthenticated, password, errorMessage, checkPassword } = useRunArcadeAuth()
const { state, catalog, addCustomMission, deleteCustomMission } = useRunArcadeState()
const {
  view,
  missionKey,
  newMissionData,
  launched,
  energy,
  plan,
  selectMission,
  showCreateForm,
  stepBaseTime,
  shiftEnergy,
  step,
  cycleSeriesDist,
  cycleHillDuration,
  selectLevel,
  backToMenu,
  launch,
  saveNewMission,
  cancelCreate,
  addBlockToCustomMission,
  removeBlockFromCustomMission,
  cycleNewMissionColor,
} = useRunArcadeSetup(state, catalog)

function onStep(key: string, dir: -1 | 1) {
  step(key as keyof typeof state, dir)
}
</script>

<template>
  <!-- Login -->
  <RunArcadeLogin
    v-if="!isAuthenticated"
    v-model:password="password"
    :error-message="errorMessage"
    @submit="checkPassword"
  />

  <!-- Consola -->
  <template v-else>
    <div class="min-h-full w-full flex items-start sm:items-center justify-center p-3 sm:p-6">
      <div
        class="crt relative w-full max-w-[420px] rounded-[28px] border-2 border-line bg-panel p-3 sm:p-4"
        :style="{ boxShadow: '0 0 0 4px #0a0d12, 0 18px 40px rgba(0,0,0,0.7), inset 0 0 60px rgba(0,0,0,0.6)' }"
      >
        <!-- Marca superior de la consola -->
        <div class="flex items-center justify-between px-1 pb-2">
          <div class="flex items-center gap-2">
            <span class="h-2.5 w-2.5 rounded-full bg-neon-red blink" aria-hidden="true" />
            <span class="text-[10px] tracking-[0.3em] text-muted">RUN·ARCADE</span>
          </div>
          <span class="text-[10px] tracking-[0.3em] text-muted">MODEL RX-40</span>
        </div>

        <!-- Pantalla -->
        <div
          class="relative overflow-hidden rounded-2xl border border-line bg-oled"
          :style="{ boxShadow: 'inset 0 0 40px rgba(0,0,0,0.9)' }"
        >
          <!-- Barra de estado (nivel + energía resumida) -->
          <div class="flex items-center justify-between border-b border-line px-4 py-2.5">
            <div class="flex flex-col leading-none">
              <span class="text-[9px] tracking-[0.25em] text-muted">NIVEL</span>
              <span class="font-display text-sm font-bold text-ink">{{ levelLabel(state.time10k) }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span
                class="h-2 w-2 rounded-full"
                :style="{ background: energy.hex, boxShadow: `0 0 8px ${energy.hex}` }"
                aria-hidden="true"
              />
              <span class="text-[10px] tracking-[0.2em]" :style="{ color: energy.hex }">
                {{ energy.label }}
              </span>
            </div>
          </div>

          <!-- Vista: menú -->
          <MissionMenu
            v-if="view === 'menu'"
            :catalog="catalog"
            :settings="state"
            :energy="energy"
            @select="selectMission"
            @create="showCreateForm"
            @delete-mission="deleteCustomMission"
            @step-base-time="stepBaseTime"
            @shift-energy="shiftEnergy"
            @select-level="selectLevel"
          />

          <!-- Vista: formulario de creación -->
          <CreateMissionForm
            v-else-if="view === 'create' && newMissionData"
            :model="newMissionData"
            @cycle-color="cycleNewMissionColor"
            @add-block="addBlockToCustomMission"
            @remove-block="removeBlockFromCustomMission"
            @cancel="cancelCreate"
            @save="saveNewMission(addCustomMission)"
          />

          <!-- Vista: setup + foto rápida -->
          <MissionSetup
            v-else-if="plan"
            :plan="plan"
            :settings="state"
            :energy="energy"
            :mission-key="missionKey"
            :launched="launched"
            @back="backToMenu"
            @launch="launch"
            @step="onStep"
            @cycle-series-dist="cycleSeriesDist"
            @cycle-hill-duration="cycleHillDuration"
          />
        </div>

        <!-- Mando / pad decorativo -->
        <div class="flex items-center justify-between px-2 pt-3">
          <div class="relative h-14 w-14" aria-hidden="true">
            <div class="absolute left-1/2 top-1/2 h-4 w-14 -translate-x-1/2 -translate-y-1/2 rounded bg-panel-2 border border-line"></div>
            <div class="absolute left-1/2 top-1/2 h-14 w-4 -translate-x-1/2 -translate-y-1/2 rounded bg-panel-2 border border-line"></div>
          </div>
          <span class="text-[9px] tracking-[0.3em] text-muted">© RUN·ARCADE '86</span>
          <div class="flex items-end gap-2" aria-hidden="true">
            <span class="h-7 w-7 rounded-full border border-line bg-panel-2" :style="{ boxShadow: 'inset 0 0 8px #ff4b3e33' }"></span>
            <span class="h-7 w-7 rounded-full border border-line bg-panel-2" :style="{ boxShadow: 'inset 0 0 8px #39ff8833' }"></span>
          </div>
        </div>
      </div>

      <!-- Overlay "READY?" al lanzar -->
      <div
        v-if="launched"
        class="fixed inset-0 z-50 grid place-items-center bg-oled/90 p-6"
        role="status"
        aria-live="polite"
      >
        <div class="text-center">
          <p class="font-display text-4xl font-black tracking-widest text-neon-green blink">READY?</p>
          <p class="mt-3 text-sm text-muted">Foto rápida lista · guarda el móvil y a correr</p>
        </div>
      </div>
    </div>
  </template>
</template>
