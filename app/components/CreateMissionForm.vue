<script setup lang="ts">
/* ============================================================================
   RUN·ARCADE — Formulario de creación/edición de misión personalizada
   ============================================================================ */

import type { Mission } from '../utils/types'

const props = defineProps<{
  model: Mission
}>()

const emit = defineEmits<{
  'update:model': [value: Mission]
  save: []
  cancel: []
  addBlock: []
  removeBlock: [index: number]
  cycleColor: []
}>()

/** Bloque de carrera: offset mostrado con signo. */
function offsetLabel(offset: number): string {
  return `${offset >= 0 ? '+' : ''}${offset}s`
}
</script>

<template>
  <div class="p-4">
    <div class="flex justify-between items-center mb-3">
      <h1 class="font-display text-lg font-black tracking-wider text-ink">
        EDITAR<span class="text-neon-green"> MISIÓN</span>
      </h1>
    </div>
    <div class="flex flex-col gap-3 text-sm max-h-[60vh] overflow-y-auto pr-2">
      <!-- Campos generales de la misión -->
      <div class="grid grid-cols-2 gap-2">
        <input v-model="model.name" placeholder="Nombre" class="form-input" />
        <input v-model="model.icon" placeholder="Icono" class="form-input" />
      </div>
      <input v-model="model.sub" placeholder="Subtítulo" class="form-input" />
      <div class="flex items-center justify-between">
        <span class="text-xs text-muted">Color</span>
        <button
          class="press h-8 w-8 rounded-md border border-line"
          :style="{ background: model.hex }"
          @click="emit('cycleColor')"
          aria-label="Cambiar color"
        />
      </div>
      <hr class="border-line my-2" />

      <!-- Editor de bloques dinámico -->
      <div
        v-for="(block, index) in model.planConfig.blocks"
        :key="index"
        class="p-3 rounded-lg border border-line bg-panel-2"
      >
        <div class="flex justify-between items-center mb-2">
          <span class="text-xs font-bold tracking-widest text-muted">{{ block.type.toUpperCase() }}</span>
          <button
            @click="emit('removeBlock', index)"
            class="h-5 w-5 bg-neon-red text-oled rounded-full text-xs font-bold"
            aria-label="Eliminar bloque"
          >
            X
          </button>
        </div>

        <!-- Controles para Warmup y Cooldown -->
        <template v-if="block.type === 'warmup' || block.type === 'cooldown'">
          <div class="flex items-center gap-2">
            <span class="text-xs text-muted">Duración (min)</span>
            <input v-model.number="block.value" type="number" class="form-input w-full" />
          </div>
        </template>

        <!-- Controles para Bloque de Carrera -->
        <template v-if="block.type === 'run'">
          <div class="flex flex-col gap-2">
            <div class="grid grid-cols-2 gap-2">
              <select v-model="block.unit" class="form-input">
                <option value="distance">Distancia</option>
                <option value="duration">Duración</option>
              </select>
              <div class="flex items-center gap-1">
                <input v-model.number="block.value" type="number" class="form-input" />
                <span class="text-xs text-muted">{{ block.unit === 'distance' ? 'km' : 'min' }}</span>
              </div>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs text-muted">Ritmo: {{ offsetLabel(block.offset) }} (vs base)</label>
              <input v-model.number="block.offset" type="range" min="-30" max="90" class="w-full" />
            </div>
          </div>
        </template>
      </div>

      <!-- Botón para añadir nuevo bloque -->
      <button @click="emit('addBlock')" class="press-btn-secondary text-sm py-2 mt-2">
        + Añadir Bloque de Carrera
      </button>
    </div>

    <!-- Botones de Acción -->
    <div class="mt-4 grid grid-cols-2 gap-3">
      <button @click="emit('cancel')" class="press-btn-secondary">Cancelar</button>
      <button @click="emit('save')" class="press-btn-primary">Guardar</button>
    </div>
  </div>
</template>

<style scoped>
/* Estilos para el formulario de nueva misión */
.form-input {
  background-color: var(--color-panel-2);
  border: 1px solid var(--color-line);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  color: var(--color-ink);
  width: 100%;
}
.form-input::placeholder {
  color: var(--color-muted);
}
.form-input:focus {
  outline: none;
  border-color: var(--color-neon-green);
}

.press-btn-primary,
.press-btn-secondary {
  padding: 0.75rem;
  border-radius: 0.75rem;
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
  letter-spacing: 0.05em;
  transition: all 0.1s ease;
}
.press-btn-primary {
  background-color: var(--color-neon-green);
  color: var(--color-oled);
  border: 2px solid var(--color-neon-green);
  box-shadow: 4px 4px 0 0 #2a9c5d55;
}
.press-btn-secondary {
  background-color: var(--color-panel-2);
  color: var(--color-ink);
  border: 2px solid var(--color-line);
  box-shadow: 4px 4px 0 0 #232b38;
}
.press-btn-primary:active,
.press-btn-secondary:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 0 #00000055;
}
</style>
