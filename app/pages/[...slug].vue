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
import { ref, computed, reactive, watch } from "vue"

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
  longRunKm: 12,
  progressiveKm: 10,
  hillReps: 8,
  hillDuration: 60,
})

// --- Lógica de persistencia en localStorage con Debounce ---

function debounce(fn, delay) {
  let timeoutId
  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}

// Cargar estado desde localStorage al inicio
const savedState = localStorage.getItem("runArcadeState")
if (savedState) {
  Object.assign(state, JSON.parse(savedState))
}

const saveState = debounce((newState) => {
  localStorage.setItem("runArcadeState", JSON.stringify(newState))
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
  if (password.value === "Farah01") {
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

/* -------------------------------------------------------------------------- */
/*  CATÁLOGO DE MISIONES (menú de juego)                                      */
/* -------------------------------------------------------------------------- */
const MISSIONS = [
  { key: "regenerar", name: "REGENERAR", sub: "Regenerativo · suave", icon: "🟢", hex: "#39ff88" },
  { key: "suave", name: "RITMO SUAVE", sub: "Aeróbico · base", icon: "🔵", hex: "#35c1ff" },
  { key: "series", name: "SERIES", sub: "Intervalos · VO2", icon: "⚡", hex: "#ff4b3e" },
  { key: "tempo", name: "TEMPO", sub: "Umbral · sostenido", icon: "🔥", hex: "#ff8a1e" },
  { key: "fartlek", name: "FARTLEK", sub: "Cambios de ritmo", icon: "🌀", hex: "#b06bff" },
  { key: "tirada-larga", name: "TIRADA LARGA", sub: "Resistencia · fondo", icon: "🔋", hex: "#ffc700" },
  { key: "progresiva", name: "PROGRESIVA", sub: "De menos a más", icon: "📈", hex: "#ff6b00" },
  { key: "cuestas", name: "CUESTAS", sub: "Fuerza · potencia", icon: "⛰️", hex: "#d9334a" },
  { key: "piramide", name: "PIRÁMIDE", sub: "Intervalos · control", icon: "🔺", hex: "#8a42e2" },
]

const activeMission = computed(() => MISSIONS.find((m) => m.key === missionKey.value) || null)

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

const HILL_DURATIONS = [45, 60, 90]
const SERIES_DISTANCES = [400, 800, 1000]

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
const stepLongRun = clamp("longRunKm", 8, 30, 1)
const stepProgressive = clamp("progressiveKm", 6, 18, 2)
const stepHillReps = clamp("hillReps", 4, 12, 1)

function cycleHillDuration(dir) {
  const i = HILL_DURATIONS.indexOf(state.hillDuration)
  const n = i + dir
  if (n >= 0 && n < HILL_DURATIONS.length) state.hillDuration = HILL_DURATIONS[n]
}

function cycleSeriesDist(dir) {
  const i = SERIES_DISTANCES.indexOf(state.seriesDist)
  const n = i + dir
  if (n >= 0 && n < SERIES_DISTANCES.length) state.seriesDist = SERIES_DISTANCES[n]
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
  regenerar: 75,
  suave: 48,
  tempo: 12,
  series: -18,
  fartlekFast: -12,
  fartlekSlow: 55,
  recovery: 70,
  larga: 55,       // Ritmo de tirada larga (igual que fartlek suave)
  prog1: 60,       // 1er tercio progresivo
  prog2: 35,       // 2o tercio progresivo
  prog3: 12,       // 3er tercio progresivo (igual que tempo)
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

/* -------------------------------------------------------------------------- */
/*  CONSTRUCCIÓN DEL PLAN (la "foto rápida")                                  */
/* -------------------------------------------------------------------------- */
const TIPS = {
  regenerar: "Ritmo de charla. Si no puedes hablar, vas demasiado rápido. Hoy toca sumar, no sufrir.",
  suave: "Corre relajado y controla la respiración. Termina con ganas de hacer un km más.",
  series: "Empieza controlado: la primera serie debe parecerte fácil. Corre las últimas igual que las primeras.",
  tempo: "Ritmo 'cómodamente duro': sostenible pero exigente. No lo conviertas en una carrera.",
  fartlek: "Juega con el ritmo. Exprime las partes rápidas y recupera DE VERDAD en las suaves.",
  "tirada-larga": "La clave es la consistencia. Mantén un ritmo que te permita conversar. No te obsesiones con la velocidad, hoy sumamos kilómetros.",
  progresiva: "Paciencia al principio. La primera parte debe sentirse muy cómoda. Concéntrate en apretar de verdad solo en el último tercio.",
  cuestas: "Ataca la subida con buena forma: mirada al frente, braceo activo. La recuperación es clave, baja trotando muy suave para estar listo para la siguiente.",
  piramide: "Mantén la calma en la subida de la pirámide; no gastes toda la energía. El objetivo es hacer la segunda mitad tan fuerte como la primera.",
}

// step: { tag, label, meta, pace, km, sec, hex }
const plan = computed(() => {
  const m = activeMission.value
  // OPTIMIZACIÓN: No calcular el plan si no estamos en la vista de setup
  if (!m || view.value !== "setup") return null
  const steps = []

  const warm = (min) => {
    const p = pace("warmup")
    steps.push({
      tag: "WARM-UP",
      label: "Calentamiento",
      meta: `${min} min · trote progresivo`,
      pace: p,
      km: (min * 60) / p,
      sec: min * 60,
      hex: "#39ff88",
    })
  }
  const cool = (min) => {
    const p = pace("cooldown")
    steps.push({
      tag: "COOL-DOWN",
      label: "Enfriamiento",
      meta: `${min} min · trote muy suave`,
      pace: p,
      km: (min * 60) / p,
      sec: min * 60,
      hex: "#35c1ff",
    })
  }

  if (m.key === "regenerar") {
    const p = pace("regenerar")
    const sec = state.regenMin * 60
    steps.push({
      tag: "MAIN",
      label: "Rodaje regenerativo",
      meta: `${state.regenMin} min continuos`,
      pace: p,
      km: sec / p,
      sec,
      hex: m.hex,
    })
    steps.push({
      tag: "EXTRA",
      label: "Movilidad + estiramientos",
      meta: "5 min · suelta piernas",
      pace: null,
      km: 0,
      sec: 300,
      hex: "#ffe14d",
    })
  }

  if (m.key === "suave") {
    warm(8)
    const p = pace("suave")
    const sec = state.aerobicKm * p
    steps.push({
      tag: "MAIN",
      label: "Rodaje aeróbico",
      meta: `${state.aerobicKm} km continuos`,
      pace: p,
      km: state.aerobicKm,
      sec,
      hex: m.hex,
    })
    cool(5)
  }

  if (m.key === "series") {
    warm(12)
    const wp = pace("series")
    const rp = pace("recovery")
    const workKm = (state.seriesReps * state.seriesDist) / 1000
    const workSec = workKm * wp
    const recSecEach = 90
    const recTotalSec = state.seriesReps * recSecEach
    const recKm = recTotalSec / rp
    steps.push({
      tag: "MAIN",
      label: "Bloque de series",
      meta: `${state.seriesReps} × ${state.seriesDist}m · rec 90'' trote`,
      pace: wp,
      km: workKm + recKm,
      sec: workSec + recTotalSec,
      hex: m.hex,
      recPace: rp,
    })
    cool(8)
  }

  if (m.key === "tempo") {
    warm(12)
    const p = pace("tempo")
    const sec = state.tempoMin * 60
    steps.push({
      tag: "MAIN",
      label: "Bloque tempo continuo",
      meta: `${state.tempoMin} min a umbral`,
      pace: p,
      km: sec / p,
      sec,
      hex: m.hex,
    })
    cool(8)
  }

  if (m.key === "fartlek") {
    warm(10)
    const fp = pace("fartlekFast")
    const sp = pace("fartlekSlow")
    const fastSec = state.fartlekReps * 60
    const slowSec = state.fartlekReps * 90
    const fastKm = fastSec / fp
    const slowKm = slowSec / sp
    steps.push({
      tag: "MAIN",
      label: "Bloque fartlek",
      meta: `${state.fartlekReps} × (1' fuerte / 1'30'' suave)`,
      pace: fp,
      km: fastKm + slowKm,
      sec: fastSec + slowSec,
      hex: m.hex,
      recPace: sp,
    })
    cool(8)
  }

  if (m.key === "tirada-larga") {
    warm(5)
    const p = pace("larga")
    const sec = state.longRunKm * p
    steps.push({
      tag: "MAIN",
      label: "Tirada larga",
      meta: `${state.longRunKm} km a ritmo sostenido`,
      pace: p,
      km: state.longRunKm,
      sec,
      hex: m.hex,
    })
    cool(5)
  }

  if (m.key === "progresiva") {
    warm(10)
    const p1 = pace("prog1")
    const p2 = pace("prog2")
    const p3 = pace("prog3")
    const km1 = state.progressiveKm / 3
    const km2 = state.progressiveKm / 3
    const km3 = state.progressiveKm / 3
    const sec = km1 * p1 + km2 * p2 + km3 * p3
    steps.push({
      tag: "MAIN",
      label: "Bloque progresivo",
      meta: `${state.progressiveKm} km (de ${fmtPace(p1)} a ${fmtPace(p3)}/km)`,
      pace: Math.round(sec / state.progressiveKm), // Ritmo medio para display
      km: state.progressiveKm,
      sec,
      hex: m.hex,
    })
    cool(8)
  }

  if (m.key === "cuestas") {
    warm(15)
    const rp = pace("recovery")
    const workSec = state.hillReps * state.hillDuration
    // Se asume una recuperación (bajada) del doble de la subida
    const recSec = workSec * 2
    const recKm = recSec / rp
    steps.push({
      tag: "MAIN",
      label: "Bloque de cuestas",
      meta: `${state.hillReps} × ${state.hillDuration}s · rec. bajada`,
      pace: null, // El ritmo en cuesta no es relevante
      km: recKm, // Solo contamos los km de recuperación
      sec: workSec + recSec,
      hex: m.hex,
      recPace: rp,
    })
    cool(10)
  }

  if (m.key === "piramide") {
    warm(12)
    const p = pace("series")
    const rp = pace("recovery")
    const pyramidSteps = [1, 2, 3, 4, 3, 2, 1] // en minutos
    const workSec = pyramidSteps.reduce((a, min) => a + min * 60, 0)
    const workKm = workSec / p
    const recTotalSec = (pyramidSteps.length - 1) * 90 // 90s rec
    const recKm = recTotalSec / rp
    steps.push({
      tag: "MAIN",
      label: "Bloque pirámide",
      meta: "1-2-3-4-3-2-1 min · rec 90s",
      pace: p,
      km: workKm + recKm,
      sec: workSec + recTotalSec,
      hex: m.hex,
      recPace: rp,
    })
    cool(10)
  }

  const totalKm = steps.reduce((a, s) => a + s.km, 0)
  const totalSec = steps.reduce((a, s) => a + s.sec, 0)

  return { steps, totalKm, totalSec, tip: TIPS[m.key], mission: m }
})

/* -------------------------------------------------------------------------- */
/*  NAVEGACIÓN                                                                */
/* -------------------------------------------------------------------------- */
function selectMission(key) {
  missionKey.value = key
  view.value = "setup"
}
function backToMenu() {
  view.value = "menu"
  missionKey.value = null
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
            <span class="text-[10px] text-muted blink">▍</span>
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
            <div v-for="m in MISSIONS" :key="m.key" role="none">
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
</style>
