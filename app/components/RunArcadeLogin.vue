<script setup lang="ts">
/* ============================================================================
   RUN·ARCADE — Login (parche temporal intacto: FR-012)
   ============================================================================ */

const props = defineProps<{
  password: string
  errorMessage: string
}>()

const emit = defineEmits<{
  'update:password': [value: string]
  submit: []
}>()

const passwordModel = computed({
  get: () => props.password,
  set: (value: string) => emit('update:password', value),
})

function onSubmit() {
  emit('submit')
}
</script>

<template>
  <div class="min-h-full w-full flex items-center justify-center p-3 sm:p-6">
    <div class="w-full max-w-sm">
      <form @submit.prevent="onSubmit" class="bg-panel p-8 rounded-lg shadow-lg">
        <h1 class="text-2xl font-bold mb-4 text-ink">Acceso Protegido</h1>
        <input
          v-model="passwordModel"
          type="password"
          placeholder="Contraseña"
          class="w-full bg-oled border border-line rounded px-3 py-2 mb-4 text-ink focus:outline-none focus:border-neon-green"
        />
        <button type="submit" class="w-full bg-neon-green text-oled font-bold py-2 px-4 rounded press">
          Entrar
        </button>
        <p v-if="errorMessage" class="text-neon-red mt-4">{{ errorMessage }}</p>
      </form>
    </div>
  </div>
</template>
