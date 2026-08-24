<script setup>
import "./style.css"
/* ============================================================================
   RUN ARCADE — Consola de entrenamiento retro/arcade para corredores
   Vue 3 · <script setup> · Tailwind CSS
   ----------------------------------------------------------------------------
   El "motor" calcula ritmos automáticamente a partir de la marca de 10K del
   usuario (por defecto 40:00 → ritmo base 4:00 min/km) y del estado de forma
   del día (fatiga/energía). Cada misión genera un plan estructurado con
   calentamiento, bloque principal y enfriamiento, listo para una "foto rápida".
   ========================================================================== */
import { ref, computed, reactive, watch, onMounted } from "vue"

/* -------------------------------------------------------------------------- */
/*  CATÁLOGO DE MISIONES (menú de juego)                                      */
/* -------------------------------------------------------------------------- */
const MISSIONS = [
  {
    key: "regenerar",
    name: "REGENERAR",
    sub: "Regenerativo · suave",
    icon: "🟢",
    hex: "#39ff88",
    tip: "Ritmo de charla. Si no puedes hablar, vas demasiado rápido. Hoy toca sumar, no sufrir.",
    type: "custom",
    planConfig: {
      blocks: [
        { type: "run", label: "Rodaje regenerativo", metaTemplate: "{value} min continuos", unit: "duration", value_param: "regenMin", offset: 75 },
        { type: "extra", label: "Movilidad + estiramientos", meta: "5 min · suelta piernas", sec: 300, km: 0, hex: "#ffe14d" },
      ]
    },
  },
  {
    key: "suave",
    name: "RITMO SUAVE",
    sub: "Aeróbico · base",
    icon: "🔵",
    hex: "#35c1ff",
    tip: "Corre relajado y controla la respiración. Termina con ganas de hacer un km más.",
    type: "custom",
    planConfig: {
      blocks: [
        { type: "warmup", unit: "duration", value: 8 },
        { type: "run", label: "Rodaje aeróbico", metaTemplate: "{value} km continuos", unit: "distance", value_param: "aerobicKm", offset: 48 },
        { type: "cooldown", unit: "duration", value: 5 },
      ]
    },
  },
    {
    key: "series",
    name: "SERIES",
    sub: "Intervalos · VO2",
    icon: "⚡",
    hex: "#ff4b3e",
    tip: "Empieza controlado: la primera serie debe parecerte fácil. Corre las últimas igual que las primeras.",
    type: "custom",
    planConfig: {
       blocks: [
        { type: "warmup", unit: "duration", value: 12 },
        { type: "interval", label: "Bloque de series", metaTemplate: "{reps} × {dist}m · rec {rec_s}'' trote", work_offset: -18, rec_pace_offset: "recovery", params: { reps: "seriesReps", dist: "seriesDist", rec_s: 90 }},
        { type: "cooldown", unit: "duration", value: 8 },
      ]
    },
     config: { distances: [400, 800, 1000] },
  },
  {
    key: "tempo",
    name: "TEMPO",
    sub: "Umbral · sostenido",
    icon: "🔥",
    hex: "#ff8a1e",
    tip: "Ritmo 'cómodamente duro': sostenible pero exigente. No lo conviertas en una carrera.",
    type: "custom",
    planConfig: {
      blocks: [
        { type: "warmup", unit: "duration", value: 12 },
        { type: "run", label: "Bloque tempo continuo", metaTemplate: "{value} min a umbral", unit: "duration", value_param: "tempoMin", offset: 12 },
        { type: "cooldown", unit: "duration", value: 8 },
      ]
    },
  },
  {
    key: "fartlek",
    name: "FARTLEK",
    sub: "Cambios de ritmo",
    icon: "🌀",
    hex: "#b06bff",
    tip: "Juega con el ritmo. Exprime las partes rápidas y recupera DE VERDAD en las suaves.",
    type: "custom",
    planConfig: {
      blocks: [
        { type: "warmup", unit: "duration", value: 10 },
        { type: "interval", label: "Bloque fartlek", metaTemplate: "{reps} × ({work_s}'' fuerte / {rec_s}'' suave)", work_offset: -12, rec_pace_offset: "fartlekSlow", params: { reps: "fartlekReps", work_s: 60, rec_s: 90 }},
        { type: "cooldown", unit: "duration", value: 8 },
      ]
    },
  },
  {
    key: "tirada-larga",
    name: "TIRADA LARGA",
    sub: "Resistencia · fondo",
    icon: "🔋",
    hex: "#ffc700",
    tip: "La clave es la consistencia. Mantén un ritmo que te permita conversar. No te obsesiones con la velocidad, hoy sumamos kilómetros.",
    type: "custom",
    planConfig: {
      blocks: [
        { type: "warmup", unit: "duration", value: 5 },
        { type: "run", label: "Tirada larga", metaTemplate: "{value} km a ritmo sostenido", unit: "distance", value_param: "longRunKm", offset: 55 },
        { type: "cooldown", unit: "duration", value: 5 },
      ]
    },
  },
    {
    key: "progresiva",
    name: "PROGRESIVA",
    sub: "De menos a más",
    icon: "📈",
    hex: "#ff6b00",
    tip: "Paciencia al principio. La primera parte debe sentirse muy cómoda. Concéntrate en apretar de verdad solo en el último tercio.",
    type: "custom",
    planConfig: {
      blocks: [
        { type: "warmup", unit: "duration", value: 10 },
        { type: "progressive", label: "Bloque progresivo", param: "progressiveKm", offsets: ["prog1", "prog2", "prog3"] },
        { type: "cooldown", unit: "duration", value: 8 },
      ]
    },
  },
  {
    key: "cuestas",
    name: "CUESTAS",
    sub: "Fuerza · potencia",
    icon: "⛰️",
    hex: "#d9334a",
    tip: "Ataca la subida con buena forma: mirada al frente, braceo activo. La recuperación es clave, baja trotando muy suave para estar listo para la siguiente.",
    type: "custom",
    planConfig: {
      blocks: [
        { type: "warmup", unit: "duration", value: 15 },
        { type: "hills", label: "Bloque de cuestas", metaTemplate: "{reps} × {work_s}s · rec. bajada", rec_pace_offset: "recovery", params: { reps: "hillReps", work_s: "hillDuration", rec_multiplier: 2 }},
        { type: "cooldown", unit: "duration", value: 10 },
      ]
    },
    config: { durations: [45, 60, 90] },
  },
  {
    key: "piramide",
    name: "PIRÁMIDE",
    sub: "Intervalos · control",
    icon: "🔺",
    hex: "#8a42e2",
    tip: "Mantén la calma en la subida de la pirámide; no gastes toda la energía. El objetivo es hacer la segunda mitad tan fuerte como la primera.",
    type: "custom",
    planConfig: {
      blocks: [
        { type: "warmup", unit: "duration", value: 12 },
        { type: "pyramid", label: "Bloque pirámide", metaTemplate: "1-2-3-4-3-2-1 min · rec {rec_s}s", work_offset: -18, rec_pace_offset: "recovery", params: { steps_min: [1, 2, 3, 4, 3, 2, 1], rec_s: 90 }},
        { type: "cooldown", unit: "duration", value: 10 },
      ]
    },
  },
  {
    key: "cacos",
    name: "CACOS",
    sub: "Caminar · correr",
    icon: "🚶‍♂️",
    hex: "#00d4a8",
    tip: "Alterna correr y caminar sin prisas. Recupera bien caminando y vuelve a correr con buenas sensaciones.",
    type: "custom",
    planConfig: {
      blocks: [
        { type: "warmup", unit: "duration", value: 5 },
        { type: "interval", label: "Bloque CACOS", metaTemplate: "{reps} × {work_s}'' corre / {rec_s}'' camina", work_offset: -12, rec_pace_offset: "walk", params: { reps: "cacosReps", work_s: 120, rec_s: 60 } },
        { type: "cooldown", unit: "duration", value: 5 },
      ]
    },
  },
]

// El estado que se guardará en localStorage
const state = reactive({
  time10k: 2400,
  energyIndex: 1,
  // --- Parámetros de misión ---
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
  missions: MISSIONS,
})

// --- Lógica de persistencia en localStorage con Debounce ---

function debounce(fn, delay) {
  let timeoutId
  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}

onMounted(() => {
  // Cargar estado desde localStorage al inicio
  const savedState = localStorage.getItem("runArcadeState")
  if (savedState) {
    Object.assign(state, JSON.parse(savedState))
  }
})

const saveState = debounce((newState) => {
  if (import.meta.client) {
    localStorage.setItem("runArcadeState", JSON.stringify(newState))
  }
}, 400) // 400ms de espera

// Guardar estado en localStorage cada vez que cambie
watch(
  () => state,
  (newState) => {
    saveState(newState)
  },
  { deep: true }
)

const isAuthenticated = ref(false)
const password = ref("")
const errorMessage = ref("")

const checkPassword = () => {
  if (password.value === "Farah") {
    isAuthenticated.value = true
    errorMessage.value = ""
  } else {
    errorMessage.value = "Contraseña incorrecta"
  }
}


/* -------------------------------------------------------------------------- */
/*  ESTADO REACTIVO PRINCIPAL                                                 */
/* -------------------------------------------------------------------------- */

// Vista actual: "menu" (SELECT MISSION) | "setup" (config + foto rápida)
const view = ref("menu")

// Misión seleccionada (clave)
const missionKey = ref(null)

// Estado para el formulario de creación de misiones
const newMissionData = ref(null)

const PREDEFINED_COLORS = ["#39ff88", "#35c1ff", "#ff4b3e", "#ff8a1e", "#b06bff", "#ffc700", "#d9334a", "#e0e0e0"]

function showCreateForm() {
  newMissionData.value = {
    key: `custom_${Date.now()}`,
    name: "Carrera",
    sub: "A medida",
    icon: "👟",
    hex: PREDEFINED_COLORS[Math.floor(Math.random() * PREDEFINED_COLORS.length)],
    tip: "¡Buen entrenamiento!",
    type: "custom",
    planConfig: {
      blocks: [
        { type: "warmup", value: 10, unit: "duration" },
        { type: "run", label: "Carrera", metaTemplate: "{value} km", value: 5, unit: "distance", offset: 50 },
        { type: "cooldown", value: 5, unit: "duration" },
      ]
    },
  }
  view.value = "create"
}

function cycleNewMissionColor() {
  const currentIndex = PREDEFINED_COLORS.indexOf(newMissionData.value.hex)
  const nextIndex = (currentIndex + 1) % PREDEFINED_COLORS.length
  newMissionData.value.hex = PREDEFINED_COLORS[nextIndex]
}

function removeBlockFromCustomMission(index) {
  if (newMissionData.value.planConfig.blocks.length > 1) {
    newMissionData.value.planConfig.blocks.splice(index, 1)
  }
}
function addBlockToCustomMission() {
  newMissionData.value.planConfig.blocks.splice(-1, 0, {
    type: "run",
    label: "Nuevo Bloque",
    metaTemplate: "{value} km",
    value: 3,
    unit: "distance",
    offset: 60,
  });
}

function saveNewMission() {
  if (!newMissionData.value) return
  state.missions.push(JSON.parse(JSON.stringify(newMissionData.value)))
  view.value = "menu"
}

function deleteMission(key) {
  const index = state.missions.findIndex(m => m.key === key)
  if (index !== -1 && state.missions[index].key.startsWith('custom_')) {
    state.missions.splice(index, 1)
  }
}

function backToMenu() {
  view.value = "menu"
  missionKey.value = null
}


const activeMission = computed(() => state.missions.find((m) => m.key === missionKey.value) || null)

/* -------------------------------------------------------------------------- */
/*  ENERGÍA / FATIGA DEL DÍA                                                  */
/*  Multiplicador aplicado al ritmo (mayor = más lento)                       */
/* -------------------------------------------------------------------------- */
const ENERGY_LEVELS = [
  { key: "fresco", label: "FRESCO", note: "+2% más rápido", mult: 0.98, hex: "#39ff88" },
  { key: "normal", label: "NORMAL", note: "ritmo base", mult: 1.0, hex: "#35c1ff" },
  { key: "cansado", label: "CANSADO", note: "-5% más lento", mult: 1.05, hex: "#ff8a1e" },
]
const energy = computed(() => ENERGY_LEVELS[state.energyIndex])

function shiftEnergy(dir) {
  const next = state.energyIndex + dir
  if (next >= 0 && next < ENERGY_LEVELS.length) state.energyIndex = next
}

/* -------------------------------------------------------------------------- */
/*  PARÁMETROS DE CONFIGURACIÓN POR MISIÓN                                    */
/* -------------------------------------------------------------------------- */

function clamp(target, min, max, step) {
  return (dir) => {
    const v = state[target] + dir * step
    if (v >= min && v <= max) state[target] = v
  }
}
const stepSeriesReps = clamp("seriesReps", 3, 12, 1)
const stepTempo = clamp("tempoMin", 10, 45, 5)
const stepAerobic = clamp("aerobicKm", 4, 16, 1)
const stepRegen = clamp("regenMin", 20, 60, 5)
const stepFartlek = clamp("fartlekReps", 4, 14, 1)
const stepCacosReps = clamp("cacosReps", 4, 16, 1)
const stepLongRun = clamp("longRunKm", 8, 30, 1)
const stepProgressive = clamp("progressiveKm", 6, 18, 2)
const stepHillReps = clamp("hillReps", 4, 12, 1)

function cycleHillDuration(dir) {
  const options = activeMission.value.planConfig.config.durations
  const i = options.indexOf(state.hillDuration)
  const n = i + dir
  if (n >= 0 && n < options.length) state.hillDuration = options[n]
}

function cycleSeriesDist(dir) {
  const options = activeMission.value.planConfig.config.distances
  const i = options.indexOf(state.seriesDist)
  const n = i + dir
  if (n >= 0 && n < options.length) state.seriesDist = options[n]
}

/* -------------------------------------------------------------------------- */
/*  EL MOTOR DE RITMOS                                                        */
/* -------------------------------------------------------------------------- */

// Ritmo base en seg/km derivado de la marca de 10K
const basePace = computed(() => Math.round(state.time10k / 10))


// Offsets (seg/km) relativos al ritmo base para cada tipo de esfuerzo
const OFFSETS = {
  warmup: 60,
  cooldown: 65,
  // Ritmos para partes de un entrenamiento que no son el bloque principal
  fartlekSlow: 55,
  recovery: 70,
  walk: 110,
  // Tercios de la progresiva
  prog1: 60,
  prog2: 35,
  prog3: 12,
}

// Ritmo efectivo = (base + offset) ajustado por energía del día
function pace(offsetKey) {
  return Math.round((basePace.value + OFFSETS[offsetKey]) * energy.value.mult)
}

/* -------------------------------------------------------------------------- */
/*  FORMATEADORES                                                             */
/* -------------------------------------------------------------------------- */
function fmtPace(sec) {
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}
function fmtDuration(sec) {
  const total = Math.round(sec / 60)
  if (total < 60) return `${total} min`
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${h}h ${String(m).padStart(2, "0")}m`
}
function fmtKm(km) {
  return `${km.toFixed(1)} km`
}
const levelLabel = computed(() => `10K · ${fmtPace(basePace.value)}/km`)

function stepBaseTime(dir) {
  const v = state.time10k + dir * 30 // ±30s en la marca de 10K
  if (v >= 1800 && v <= 3600) state.time10k = v // entre 30:00 y 60:00
}

// step: { tag, label, meta, pace, km, sec, hex }
const plan = computed(() => {
  const m = activeMission.value
  if (!m || view.value !== "setup") return null

  const steps = []
  const blocks = m.planConfig.blocks || []

  blocks.forEach(block => {
    const blockProcessor = {
      warmup: (b) => {
        const p = pace("warmup")
        const sec = b.value * 60
        steps.push({ tag: "WARM-UP", label: "Calentamiento", meta: `${b.value} min · trote progresivo`, pace: p, km: sec / p, sec, hex: "#39ff88" })
      },
      cooldown: (b) => {
        const p = pace("cooldown")
        const sec = b.value * 60
        steps.push({ tag: "COOL-DOWN", label: "Enfriamiento", meta: `${b.value} min · trote muy suave`, pace: p, km: sec / p, sec, hex: "#35c1ff" })
      },
      run: (b) => {
        const p = Math.round((basePace.value + b.offset) * energy.value.mult)
        const value = b.value_param ? state[b.value_param] : b.value
        const sec = b.unit === "duration" ? value * 60 : value * p
        const km = b.unit === "distance" ? value : sec / p
        const meta = b.metaTemplate.replace("{value}", value)
        steps.push({ tag: "MAIN", label: b.label, meta, pace: p, km, sec, hex: m.hex })
      },
      interval: (b) => {
        const p = { work: Math.round((basePace.value + b.work_offset) * energy.value.mult), rec: pace(b.rec_pace_offset) }
        const reps = state[b.params.reps]
        const dist_m = b.params.dist ? state[b.params.dist] : null
        const work_s = b.params.work_s || (dist_m / 1000 * p.work)
        const rec_s = b.params.rec_s
        const total_work_s = reps * (dist_m ? (dist_m / 1000 * p.work) : work_s)
        const total_rec_s = (reps - 1) * rec_s
        const km = (total_work_s / p.work) + (total_rec_s / p.rec)
        const sec = total_work_s + total_rec_s
        const meta = b.metaTemplate.replace("{reps}", reps).replace("{dist}", dist_m).replace("{work_s}", work_s).replace("{rec_s}", rec_s)
        steps.push({ tag: "MAIN", label: b.label, meta, pace: p.work, km, sec, hex: m.hex, recPace: p.rec })
      },
       progressive: (b) => {
        const km_total = state[b.param]
        const km_part = km_total / 3
        const p1 = pace(b.offsets[0])
        const p2 = pace(b.offsets[1])
        const p3 = pace(b.offsets[2])
        const sec = (km_part * p1) + (km_part * p2) + (km_part * p3)
        const meta = `${km_total} km (de ${fmtPace(p1)} a ${fmtPace(p3)}/km)`
        steps.push({ tag: "MAIN", label: b.label, meta, pace: Math.round(sec / km_total), km: km_total, sec, hex: m.hex })
      },
        hills: (b) => {
        const rp = pace(b.rec_pace_offset)
        const reps = state[b.params.reps]
        const work_s = state[b.params.work_s]
        const rec_s = work_s * b.params.rec_multiplier
        const total_work_s = reps * work_s
        const total_rec_s = (reps - 1) * rec_s
        const km = total_rec_s / rp
        const sec = total_work_s + total_rec_s
        const meta = b.metaTemplate.replace('{reps}', reps).replace('{work_s}', work_s)
        steps.push({ tag: 'MAIN', label: b.label, meta, pace: null, km, sec, hex: m.hex, recPace: rp })
      },
      pyramid: (b) => {
        const p = Math.round((basePace.value + b.work_offset) * energy.value.mult)
        const rp = pace(b.rec_pace_offset)
        const work_s = b.params.steps_min.reduce((a, min) => a + min * 60, 0)
        const rec_s = (b.params.steps_min.length - 1) * b.params.rec_s
        const km = (work_s / p) + (rec_s / rp)
        const sec = work_s + rec_s
        const meta = b.metaTemplate.replace('{rec_s}', b.params.rec_s)
        steps.push({ tag: 'MAIN', label: b.label, meta, pace: p, km, sec, hex: m.hex, recPace: rp })
      },
      extra: (b) => {
        steps.push({ tag: "EXTRA", ...b })
      },
    }

    if (blockProcessor[block.type]) {
      blockProcessor[block.type](block)
    }
  })

  const totalKm = steps.reduce((a, s) => a + s.km, 0)
  const totalSec = steps.reduce((a, s) => a + s.sec, 0)

  return { steps, totalKm, totalSec, tip: m.tip, mission: m }
})

/* -------------------------------------------------------------------------- */
/*  NAVEGACIÓN                                                                */
/* -------------------------------------------------------------------------- */
function selectMission(key) {
  missionKey.value = key
  view.value = "setup"
}

// "Foto rápida" tomada → feedback tipo arcade
const launched = ref(false)
function launch() {
  launched.value = true
  setTimeout(() => (launched.value = false), 2200)
}
</script>

<template>
  <div v-if="!isAuthenticated" class="min-h-full w-full flex items-center justify-center p-3 sm:p-6">
    <div class="w-full max-w-sm">
      <form @submit.prevent="checkPassword" class="bg-panel p-8 rounded-lg shadow-lg">
        <h1 class="text-2xl font-bold mb-4 text-ink">Acceso Protegido</h1>
        <input v-model="password" type="password" placeholder="Contraseña" class="w-full bg-oled border border-line rounded px-3 py-2 mb-4 text-ink focus:outline-none focus:border-neon-green">
        <button type="submit" class="w-full bg-neon-green text-oled font-bold py-2 px-4 rounded press">Entrar</button>
        <p v-if="errorMessage" class="text-neon-red mt-4">{{ errorMessage }}</p>
      </form>
    </div>
  </div>
  <template v-else>
  <!-- ====================================================================== -->
  <!--  CARCASA DE LA CONSOLA                                                 -->
  <!-- ====================================================================== -->
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

      <!-- ================================================================== -->
      <!--  PANTALLA                                                          -->
      <!-- ================================================================== -->
      <div
        class="relative overflow-hidden rounded-2xl border border-line bg-oled"
        :style="{ boxShadow: 'inset 0 0 40px rgba(0,0,0,0.9)' }"
      >
        <!-- Barra de estado (nivel + energía resumida) -->
        <div class="flex items-center justify-between border-b border-line px-4 py-2.5">
          <div class="flex flex-col leading-none">
            <span class="text-[9px] tracking-[0.25em] text-muted">NIVEL</span>
            <span class="font-display text-sm font-bold text-ink">{{ levelLabel }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span
              class="h-2 w-2 rounded-full"
              :style="{ background: energy.hex, boxShadow: `0 0 8px ${energy.hex}` }"
              aria-hidden="true"
            />
            <span class="text-[10px] tracking-[0.2em]" :style="{ color: energy.hex }">{{ energy.label }}</span>
          </div>
        </div>

        <!-- ============================================================== -->
        <!--  ESTADO 1 · MENÚ PRINCIPAL (SELECT MISSION)                    -->
        <!-- ============================================================== -->
        <div v-if="view === 'menu'" class="p-4">
          <div class="mb-3 flex items-center justify-between">
            <h1 class="font-display text-lg font-black tracking-wider text-ink">
              SELECT<span class="text-neon-green"> MISSION</span>
            </h1>
            <button @click="showCreateForm" class="press grid h-8 w-8 place-items-center rounded-md border-2 border-line bg-panel text-2xl font-black text-neon-green" aria-label="Crear nueva misión">
              +
            </button>
          </div>

          <!-- Ajuste rápido del nivel (marca de 10K) -->
          <div class="mb-4 flex items-center justify-between rounded-lg border border-line bg-panel-2 px-3 py-2">
            <span class="text-[10px] tracking-[0.2em] text-muted">MARCA 10K</span>
            <div class="flex items-center gap-3">
              <button
                class="press grid h-7 w-7 place-items-center rounded-md border border-line bg-panel text-ink"
                @click="stepBaseTime(-1)"
                aria-label="Bajar marca de 10K"
              >
                ◀
              </button>
              <span class="w-16 text-center font-display text-base font-bold text-neon-green">
                {{ fmtPace(state.time10k) }}
              </span>
              <button
                class="press grid h-7 w-7 place-items-center rounded-md border border-line bg-panel text-ink"
                @click="stepBaseTime(1)"
                aria-label="Subir marca de 10K"
              >
                ▶
              </button>
            </div>
          </div>

          <!-- Botones de misión tipo menú de juego -->
          <div class="grid grid-cols-3 gap-3" role="menu" aria-label="Tipos de entrenamiento">
            <div v-for="m in state.missions" :key="m.key" role="none" class="relative">
              <button
                role="menuitem"
                class="press group flex h-36 w-full flex-col items-center justify-start gap-2 rounded-xl border-2 bg-panel-2 px-2 py-3 text-center transition-colors"
                :style="{
                  borderColor: m.hex + '55',
                  boxShadow: `4px 4px 0 0 ${m.hex}22`,
                }"
                @click="selectMission(m.key)"
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
                @click.stop="deleteMission(m.key)"
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
                :disabled="state.energyIndex === 0"
                @click="shiftEnergy(-1)"
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
                    background: i <= state.energyIndex ? energy.hex : '#232b38',
                    boxShadow: i <= state.energyIndex ? `0 0 8px ${energy.hex}` : 'none',
                  }"
                  aria-hidden="true"
                />
              </div>
              <button
                class="press grid h-10 w-10 place-items-center rounded-lg border-2 border-line bg-panel text-ink disabled:opacity-30"
                :disabled="state.energyIndex === ENERGY_LEVELS.length - 1"
                @click="shiftEnergy(1)"
                aria-label="Más cansado"
              >
                ▶
              </button>
            </div>
            <p class="mt-2 text-center font-display text-sm font-bold tracking-wide" :style="{ color: energy.hex }">
              {{ energy.label }}
            </p>
          </div>
        </div>

        <!-- ============================================================== -->
        <!--  ESTADO NUEVO · FORMULARIO DE CREACIÓN                         -->
        <!-- ============================================================== -->
        <div v-else-if="view === 'create' && newMissionData" class="p-4">
          <div class="flex justify-between items-center mb-3">
            <h1 class="font-display text-lg font-black tracking-wider text-ink">
              EDITAR<span class="text-neon-green"> MISIÓN</span>
            </h1>
          </div>
          <div class="flex flex-col gap-3 text-sm max-h-[60vh] overflow-y-auto pr-2">
            <!-- Campos generales de la misión -->
            <div class="grid grid-cols-2 gap-2">
              <input v-model="newMissionData.name" placeholder="Nombre" class="form-input">
              <input v-model="newMissionData.icon" placeholder="Icono" class="form-input">
            </div>
            <input v-model="newMissionData.sub" placeholder="Subtítulo" class="form-input">
            <hr class="border-line my-2">

            <!-- Editor de bloques dinámico -->
            <div v-for="(block, index) in newMissionData.planConfig.blocks" :key="index" class="p-3 rounded-lg border border-line bg-panel-2">
              <div class="flex justify-between items-center mb-2">
                <span class="text-xs font-bold tracking-widest text-muted">{{ block.type.toUpperCase() }}</span>
                <button @click="newMissionData.planConfig.blocks.splice(index, 1)" class="h-5 w-5 bg-neon-red text-oled rounded-full text-xs font-bold">X</button>
              </div>

              <!-- Controles para Warmup y Cooldown -->
              <template v-if="block.type === 'warmup' || block.type === 'cooldown'">
                <div class="flex items-center gap-2">
                  <span class="text-xs text-muted">Duración (min)</span>
                  <input v-model.number="block.value" type="number" class="form-input w-full">
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
                      <input v-model.number="block.value" type="number" class="form-input">
                      <span class="text-xs text-muted">{{ block.unit === 'distance' ? 'km' : 'min' }}</span>
                    </div>
                  </div>
                  <div class="flex flex-col gap-1">
                    <label class="text-xs text-muted">Ritmo: {{ block.offset >= 0 ? '+' : '' }}{{ block.offset }}s (vs base)</label>
                    <input v-model.number="block.offset" type="range" min="-30" max="90" class="w-full">
                  </div>
                </div>
              </template>
            </div>

            <!-- Botón para añadir nuevo bloque -->
            <button @click="addBlockToCustomMission" class="press-btn-secondary text-sm py-2 mt-2">
              + Añadir Bloque de Carrera
            </button>
          </div>

          <!-- Botones de Acción -->
          <div class="mt-4 grid grid-cols-2 gap-3">
            <button @click="view = 'menu'" class="press-btn-secondary">Cancelar</button>
            <button @click="saveNewMission" class="press-btn-primary">Guardar</button>
          </div>
        </div>


        <!-- ============================================================== -->
        <!--  ESTADO 2 · SETUP + FOTO RÁPIDA                                -->
        <!-- ============================================================== -->
        <div v-else-if="plan" class="p-4">
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
                  <button class="press ctrl-btn" @click="stepSeriesReps(-1)" aria-label="Menos series">◀</button>
                  <span class="w-10 text-center font-display text-base font-bold text-ink">{{ state.seriesReps }}</span>
                  <button class="press ctrl-btn" @click="stepSeriesReps(1)" aria-label="Más series">▶</button>
                </div>
              </div>
              <div class="flex items-center justify-between rounded-lg border border-line bg-panel-2 px-3 py-2">
                <span class="text-[10px] tracking-[0.2em] text-muted">DISTANCIA</span>
                <div class="flex items-center gap-3">
                  <button class="press ctrl-btn" @click="cycleSeriesDist(-1)" aria-label="Menos distancia">◀</button>
                  <span class="w-16 text-center font-display text-base font-bold text-ink">{{ state.seriesDist }}m</span>
                  <button class="press ctrl-btn" @click="cycleSeriesDist(1)" aria-label="Más distancia">▶</button>
                </div>
              </div>
            </template>

            <!-- TEMPO: minutos -->
            <div v-else-if="missionKey === 'tempo'" class="flex items-center justify-between rounded-lg border border-line bg-panel-2 px-3 py-2">
              <span class="text-[10px] tracking-[0.2em] text-muted">MIN A UMBRAL</span>
              <div class="flex items-center gap-3">
                <button class="press ctrl-btn" @click="stepTempo(-1)" aria-label="Menos minutos">◀</button>
                <span class="w-12 text-center font-display text-base font-bold text-ink">{{ state.tempoMin }}'</span>
                <button class="press ctrl-btn" @click="stepTempo(1)" aria-label="Más minutos">▶</button>
              </div>
            </div>

            <!-- SUAVE: km -->
            <div v-else-if="missionKey === 'suave'" class="flex items-center justify-between rounded-lg border border-line bg-panel-2 px-3 py-2">
              <span class="text-[10px] tracking-[0.2em] text-muted">DISTANCIA</span>
              <div class="flex items-center gap-3">
                <button class="press ctrl-btn" @click="stepAerobic(-1)" aria-label="Menos km">◀</button>
                <span class="w-14 text-center font-display text-base font-bold text-ink">{{ state.aerobicKm }} km</span>
                <button class="press ctrl-btn" @click="stepAerobic(1)" aria-label="Más km">▶</button>
              </div>
            </div>

            <!-- REGENERAR: minutos -->
            <div v-else-if="missionKey === 'regenerar'" class="flex items-center justify-between rounded-lg border border-line bg-panel-2 px-3 py-2">
              <span class="text-[10px] tracking-[0.2em] text-muted">DURACIÓN</span>
              <div class="flex items-center gap-3">
                <button class="press ctrl-btn" @click="stepRegen(-1)" aria-label="Menos minutos">◀</button>
                <span class="w-14 text-center font-display text-base font-bold text-ink">{{ state.regenMin }}'</span>
                <button class="press ctrl-btn" @click="stepRegen(1)" aria-label="Más minutos">▶</button>
              </div>
            </div>

            <!-- FARTLEK: reps -->
            <div v-else-if="missionKey === 'fartlek'" class="flex items-center justify-between rounded-lg border border-line bg-panel-2 px-3 py-2">
              <span class="text-[10px] tracking-[0.2em] text-muted">Nº CAMBIOS</span>
              <div class="flex items-center gap-3">
                <button class="press ctrl-btn" @click="stepFartlek(-1)" aria-label="Menos cambios">◀</button>
                <span class="w-10 text-center font-display text-base font-bold text-ink">{{ state.fartlekReps }}</span>
                <button class="press ctrl-btn" @click="stepFartlek(1)" aria-label="Más cambios">▶</button>
              </div>
            </div>

            <!-- CACOS: reps -->
            <div v-else-if="missionKey === 'cacos'" class="flex items-center justify-between rounded-lg border border-line bg-panel-2 px-3 py-2">
              <span class="text-[10px] tracking-[0.2em] text-muted">Nº REPETICIONES</span>
              <div class="flex items-center gap-3">
                <button class="press ctrl-btn" @click="stepCacosReps(-1)" aria-label="Menos repeticiones">◀</button>
                <span class="w-10 text-center font-display text-base font-bold text-ink">{{ state.cacosReps }}</span>
                <button class="press ctrl-btn" @click="stepCacosReps(1)" aria-label="Más repeticiones">▶</button>
              </div>
            </div>

            <!-- TIRADA LARGA: km -->
            <div v-else-if="missionKey === 'tirada-larga'" class="flex items-center justify-between rounded-lg border border-line bg-panel-2 px-3 py-2">
              <span class="text-[10px] tracking-[0.2em] text-muted">DISTANCIA</span>
              <div class="flex items-center gap-3">
                <button class="press ctrl-btn" @click="stepLongRun(-1)" aria-label="Menos km">◀</button>
                <span class="w-14 text-center font-display text-base font-bold text-ink">{{ state.longRunKm }} km</span>
                <button class="press ctrl-btn" @click="stepLongRun(1)" aria-label="Más km">▶</button>
              </div>
            </div>

            <!-- PROGRESIVA: km -->
            <div v-else-if="missionKey === 'progresiva'" class="flex items-center justify-between rounded-lg border border-line bg-panel-2 px-3 py-2">
              <span class="text-[10px] tracking-[0.2em] text-muted">DISTANCIA</span>
              <div class="flex items-center gap-3">
                <button class="press ctrl-btn" @click="stepProgressive(-1)" aria-label="Menos km">◀</button>
                <span class="w-14 text-center font-display text-base font-bold text-ink">{{ state.progressiveKm }} km</span>
                <button class="press ctrl-btn" @click="stepProgressive(1)" aria-label="Más km">▶</button>
              </div>
            </div>

            <!-- CUESTAS: reps + duración -->
            <template v-if="missionKey === 'cuestas'">
              <div class="flex items-center justify-between rounded-lg border border-line bg-panel-2 px-3 py-2">
                <span class="text-[10px] tracking-[0.2em] text-muted">Nº REPETICIONES</span>
                <div class="flex items-center gap-3">
                  <button class="press ctrl-btn" @click="stepHillReps(-1)" aria-label="Menos repeticiones">◀</button>
                  <span class="w-10 text-center font-display text-base font-bold text-ink">{{ state.hillReps }}</span>
                  <button class="press ctrl-btn" @click="stepHillReps(1)" aria-label="Más repeticiones">▶</button>
                </div>
              </div>
              <div class="flex items-center justify-between rounded-lg border border-line bg-panel-2 px-3 py-2">
                <span class="text-[10px] tracking-[0.2em] text-muted">DURACIÓN</span>
                <div class="flex items-center gap-3">
                  <button class="press ctrl-btn" @click="cycleHillDuration(-1)" aria-label="Menos duración">◀</button>
                  <span class="w-16 text-center font-display text-base font-bold text-ink">{{ state.hillDuration }}s</span>
                  <button class="press ctrl-btn" @click="cycleHillDuration(1)" aria-label="Más duración">▶</button>
                </div>
              </div>
            </template>
          </div>

          <!-- ============================================================ -->
          <!--  LA FOTO RÁPIDA (tarjeta resumen para captura)              -->
          <!-- ============================================================ -->
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

          <!-- Botones de acción final -->
          <div class="mt-4 grid grid-cols-2 gap-3">
            <button
              class="press flex items-center justify-center gap-2 rounded-xl border-2 border-line bg-panel-2 py-3 font-display text-sm font-bold tracking-wide text-ink"
              :style="{ boxShadow: '4px 4px 0 0 #232b38' }"
              @click="backToMenu"
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
              @click="launch"
            >
              🚀 ¡A JUGAR!
            </button>
          </div>
        </div>
      </div>

      <!-- ================================================================== -->
      <!--  MANDO / PAD DECORATIVO                                            -->
      <!-- ================================================================== -->
      <div class="flex items-center justify-between px-2 pt-3">
        <!-- D-pad -->
        <div class="relative h-14 w-14" aria-hidden="true">
          <div class="absolute left-1/2 top-1/2 h-4 w-14 -translate-x-1/2 -translate-y-1/2 rounded bg-panel-2 border border-line"></div>
          <div class="absolute left-1/2 top-1/2 h-14 w-4 -translate-x-1/2 -translate-y-1/2 rounded bg-panel-2 border border-line"></div>
        </div>
        <span class="text-[9px] tracking-[0.3em] text-muted">© RUN·ARCADE '86</span>
        <!-- A/B buttons -->
        <div class="flex items-end gap-2" aria-hidden="true">
          <span class="h-7 w-7 rounded-full border border-line bg-panel-2" :style="{ boxShadow: 'inset 0 0 8px #ff4b3e33' }"></span>
          <span class="h-7 w-7 rounded-full border border-line bg-panel-2" :style="{ boxShadow: 'inset 0 0 8px #39ff8833' }"></span>
        </div>
      </div>
    </div>

    <!-- ==================================================================== -->
    <!--  OVERLAY "READY?" al lanzar (feedback arcade)                        -->
    <!-- ==================================================================== -->
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

.press-btn-primary, .press-btn-secondary {
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
.press-btn-primary:active, .press-btn-secondary:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 0 #00000055;
}
</style>
