/* ============================================================================
   RUN·ARCADE — Tipos compartidos del dominio
   ----------------------------------------------------------------------------
   Tipos puros que usan utils/, composables/ y componentes. Sin lógica.
   ============================================================================ */

/** Clave de cualquier campo de configuración del usuario (para steppers y params de bloques). */
export type StateKey = keyof UserSettings

/** Clave de ritmo respecto al ritmo base (offsets del motor). */
export type PaceKey =
  | 'warmup'
  | 'cooldown'
  | 'fartlekSlow'
  | 'recovery'
  | 'walk'
  | 'prog1'
  | 'prog2'
  | 'prog3'

/** Nivel de energía/fatiga del día. */
export interface EnergyLevel {
  key: 'fresco' | 'normal' | 'cansado'
  label: string
  note: string
  mult: number
  hex: string
}

/** Configuración persistida del usuario (fuente de verdad del estado reactivo). */
export interface UserSettings {
  /** Marca de 10K en segundos (rango [1800, 3600]). */
  time10k: number
  /** Índice en ENERGY_LEVELS (0=fresco, 1=normal, 2=cansado). */
  energyIndex: number
  seriesReps: number
  seriesDist: number
  tempoMin: number
  aerobicKm: number
  regenMin: number
  fartlekReps: number
  cacosReps: number
  longRunKm: number
  progressiveKm: number
  hillReps: number
  hillDuration: number
}

/* -------------------------------------------------------------------------- */
/*  Bloques de plan (unión discriminada por `type`)                            */
/* -------------------------------------------------------------------------- */

interface PlanBlockBase {
  type: string
  label?: string
  hex?: string
}

export interface WarmupBlock extends PlanBlockBase {
  type: 'warmup'
  unit: 'duration'
  value: number
}

export interface CooldownBlock extends PlanBlockBase {
  type: 'cooldown'
  unit: 'duration'
  value: number
}

export interface RunBlock extends PlanBlockBase {
  type: 'run'
  label: string
  metaTemplate: string
  unit: 'duration' | 'distance'
  /** Valor fijo o, si existe, clave del estado que lo provee. */
  value?: number
  value_param?: StateKey
  /** Offset en s/km respecto al ritmo base. */
  offset: number
}

export interface IntervalBlock extends PlanBlockBase {
  type: 'interval'
  label: string
  metaTemplate: string
  work_offset: number
  rec_pace_offset: PaceKey
  params: {
    reps: StateKey
    dist?: StateKey
    work_s?: number
    rec_s: number
  }
}

export interface ProgressiveBlock extends PlanBlockBase {
  type: 'progressive'
  label: string
  param: StateKey
  offsets: [PaceKey, PaceKey, PaceKey]
}

export interface HillsBlock extends PlanBlockBase {
  type: 'hills'
  label: string
  metaTemplate: string
  work_offset: number
  rec_pace_offset: PaceKey
  params: {
    reps: StateKey
    work_s: StateKey
    rec_multiplier: number
  }
}

export interface PyramidBlock extends PlanBlockBase {
  type: 'pyramid'
  label: string
  metaTemplate: string
  work_offset: number
  rec_pace_offset: PaceKey
  params: {
    steps_min: number[]
    rec_s: number
  }
}

export interface ExtraBlock extends PlanBlockBase {
  type: 'extra'
  label: string
  meta: string
  sec: number
  km: number
}

export type PlanBlock =
  | WarmupBlock
  | CooldownBlock
  | RunBlock
  | IntervalBlock
  | ProgressiveBlock
  | HillsBlock
  | PyramidBlock
  | ExtraBlock

/** Configuración de bloques de una misión (más opciones de ciclo opcionales). */
export interface PlanConfig {
  blocks: PlanBlock[]
  config?: {
    distances?: number[]
    durations?: number[]
  }
}

/** Misión de entrenamiento (catálogo base o personalizada). */
export interface Mission {
  key: string
  name: string
  sub: string
  icon: string
  hex: string
  tip: string
  type: 'custom'
  planConfig: PlanConfig
}

/* -------------------------------------------------------------------------- */
/*  Plan generado (foto rápida)                                                */
/* -------------------------------------------------------------------------- */

/** Paso individual del plan. */
export interface PlanStep {
  tag: string
  label: string
  meta: string
  /** Ritmo en s/km (null para pasos sin ritmo, p. ej. EXTRA). */
  pace: number | null
  km: number
  sec: number
  hex: string
  /** Ritmo de recuperación (intervalos/cuestas/pirámide). */
  recPace?: number | null
}

/** Plan completo para la foto rápida. */
export interface RunPlan {
  steps: PlanStep[]
  totalKm: number
  totalSec: number
  tip: string
  mission: Mission
}

/* -------------------------------------------------------------------------- */
/*  Persistencia                                                               */
/* -------------------------------------------------------------------------- */

/** Formato v2 de localStorage. */
export interface PersistedStateV2 {
  version: 2
  settings: UserSettings
  customMissions: Mission[]
}
