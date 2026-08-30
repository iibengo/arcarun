/* ============================================================================
   RUN·ARCADE — Catálogo de misiones y constantes
   ----------------------------------------------------------------------------
   Fuente de verdad en código: el catálogo base NO se persiste (ver persistence).
   ============================================================================ */

import type { EnergyLevel, Mission } from './types'

/** Catálogo base de misiones (menú de juego). */
export const MISSIONS: Mission[] = [
  {
    key: 'regenerar',
    name: 'REGENERAR',
    sub: 'Regenerativo · suave',
    icon: '🟢',
    hex: '#39ff88',
    tip: 'Ritmo de charla. Si no puedes hablar, vas demasiado rápido. Hoy toca sumar, no sufrir.',
    type: 'custom',
    planConfig: {
      blocks: [
        {
          type: 'run',
          label: 'Rodaje regenerativo',
          metaTemplate: '{value} min continuos',
          unit: 'duration',
          value_param: 'regenMin',
          offset: 75,
        },
        {
          type: 'extra',
          label: 'Movilidad + estiramientos',
          meta: '5 min · suelta piernas',
          sec: 300,
          km: 0,
          hex: '#ffe14d',
        },
      ],
    },
  },
  {
    key: 'suave',
    name: 'RITMO SUAVE',
    sub: 'Aeróbico · base',
    icon: '🔵',
    hex: '#35c1ff',
    tip: 'Corre relajado y controla la respiración. Termina con ganas de hacer un km más.',
    type: 'custom',
    planConfig: {
      blocks: [
        { type: 'warmup', unit: 'duration', value: 8 },
        {
          type: 'run',
          label: 'Rodaje aeróbico',
          metaTemplate: '{value} km continuos',
          unit: 'distance',
          value_param: 'aerobicKm',
          offset: 48,
        },
        { type: 'cooldown', unit: 'duration', value: 5 },
      ],
    },
  },
  {
    key: 'series',
    name: 'SERIES',
    sub: 'Intervalos · VO2',
    icon: '⚡',
    hex: '#ff4b3e',
    tip: 'Empieza controlado: la primera serie debe parecerte fácil. Corre las últimas igual que las primeras.',
    type: 'custom',
    planConfig: {
      blocks: [
        { type: 'warmup', unit: 'duration', value: 12 },
        {
          type: 'interval',
          label: 'Bloque de series',
          metaTemplate: "{reps} × {dist}m · rec {rec_s}'' trote",
          work_offset: -18,
          rec_pace_offset: 'recovery',
          params: { reps: 'seriesReps', dist: 'seriesDist', rec_s: 90 },
        },
        { type: 'cooldown', unit: 'duration', value: 8 },
      ],
      config: { distances: [400, 800, 1000] },
    },
  },
  {
    key: 'tempo',
    name: 'TEMPO',
    sub: 'Umbral · sostenido',
    icon: '🔥',
    hex: '#ff8a1e',
    tip: "Ritmo 'cómodamente duro': sostenible pero exigente. No lo conviertas en una carrera.",
    type: 'custom',
    planConfig: {
      blocks: [
        { type: 'warmup', unit: 'duration', value: 12 },
        {
          type: 'run',
          label: 'Bloque tempo continuo',
          metaTemplate: '{value} min a umbral',
          unit: 'duration',
          value_param: 'tempoMin',
          offset: 12,
        },
        { type: 'cooldown', unit: 'duration', value: 8 },
      ],
    },
  },
  {
    key: 'fartlek',
    name: 'FARTLEK',
    sub: 'Cambios de ritmo',
    icon: '🌀',
    hex: '#b06bff',
    tip: 'Juega con el ritmo. Exprime las partes rápidas y recupera DE VERDAD en las suaves.',
    type: 'custom',
    planConfig: {
      blocks: [
        { type: 'warmup', unit: 'duration', value: 10 },
        {
          type: 'interval',
          label: 'Bloque fartlek',
          metaTemplate: "{reps} × ({work_s}'' fuerte / {rec_s}'' suave)",
          work_offset: -12,
          rec_pace_offset: 'fartlekSlow',
          params: { reps: 'fartlekReps', work_s: 60, rec_s: 90 },
        },
        { type: 'cooldown', unit: 'duration', value: 8 },
      ],
    },
  },
  {
    key: 'tirada-larga',
    name: 'TIRADA LARGA',
    sub: 'Resistencia · fondo',
    icon: '🔋',
    hex: '#ffc700',
    tip: 'La clave es la consistencia. Mantén un ritmo que te permita conversar. No te obsesiones con la velocidad, hoy sumamos kilómetros.',
    type: 'custom',
    planConfig: {
      blocks: [
        { type: 'warmup', unit: 'duration', value: 5 },
        {
          type: 'run',
          label: 'Tirada larga',
          metaTemplate: '{value} km a ritmo sostenido',
          unit: 'distance',
          value_param: 'longRunKm',
          offset: 55,
        },
        { type: 'cooldown', unit: 'duration', value: 5 },
      ],
    },
  },
  {
    key: 'progresiva',
    name: 'PROGRESIVA',
    sub: 'De menos a más',
    icon: '📈',
    hex: '#ff6b00',
    tip: 'Paciencia al principio. La primera parte debe sentirse muy cómoda. Concéntrate en apretar de verdad solo en el último tercio.',
    type: 'custom',
    planConfig: {
      blocks: [
        { type: 'warmup', unit: 'duration', value: 10 },
        {
          type: 'progressive',
          label: 'Bloque progresivo',
          param: 'progressiveKm',
          offsets: ['prog1', 'prog2', 'prog3'],
        },
        { type: 'cooldown', unit: 'duration', value: 8 },
      ],
    },
  },
  {
    key: 'cuestas',
    name: 'CUESTAS',
    sub: 'Fuerza · potencia',
    icon: '⛰️',
    hex: '#d9334a',
    tip: 'Ataca la subida con buena forma: mirada al frente, braceo activo. La recuperación es clave, baja trotando muy suave para estar listo para la siguiente.',
    type: 'custom',
    planConfig: {
      blocks: [
        { type: 'warmup', unit: 'duration', value: 15 },
        {
          type: 'hills',
          label: 'Bloque de cuestas',
          metaTemplate: '{reps} × {work_s}s · rec. bajada',
          work_offset: 20,
          rec_pace_offset: 'recovery',
          params: { reps: 'hillReps', work_s: 'hillDuration', rec_multiplier: 2 },
        },
        { type: 'cooldown', unit: 'duration', value: 10 },
      ],
      config: { durations: [45, 60, 90] },
    },
  },
  {
    key: 'piramide',
    name: 'PIRÁMIDE',
    sub: 'Intervalos · control',
    icon: '🔺',
    hex: '#8a42e2',
    tip: 'Mantén la calma en la subida de la pirámide; no gastes toda la energía. El objetivo es hacer la segunda mitad tan fuerte como la primera.',
    type: 'custom',
    planConfig: {
      blocks: [
        { type: 'warmup', unit: 'duration', value: 12 },
        {
          type: 'pyramid',
          label: 'Bloque pirámide',
          metaTemplate: '1-2-3-4-3-2-1 min · rec {rec_s}s',
          work_offset: -18,
          rec_pace_offset: 'recovery',
          params: { steps_min: [1, 2, 3, 4, 3, 2, 1], rec_s: 90 },
        },
        { type: 'cooldown', unit: 'duration', value: 10 },
      ],
    },
  },
  {
    key: 'cacos',
    name: 'CACOS',
    sub: 'Caminar · correr',
    icon: '🚶‍♂️',
    hex: '#00d4a8',
    tip: 'Alterna correr y caminar sin prisas. Recupera bien caminando y vuelve a correr con buenas sensaciones.',
    type: 'custom',
    planConfig: {
      blocks: [
        { type: 'warmup', unit: 'duration', value: 5 },
        {
          type: 'interval',
          label: 'Bloque CACOS',
          metaTemplate: "{reps} × {work_s}'' corre / {rec_s}'' camina",
          work_offset: -12,
          rec_pace_offset: 'walk',
          params: { reps: 'cacosReps', work_s: 120, rec_s: 60 },
        },
        { type: 'cooldown', unit: 'duration', value: 5 },
      ],
    },
  },
]

/** Niveles de energía/fatiga del día (multiplicador aplicado al ritmo). */
export const ENERGY_LEVELS: EnergyLevel[] = [
  { key: 'fresco', label: 'FRESCO', note: '+2% más rápido', mult: 0.98, hex: '#39ff88' },
  { key: 'normal', label: 'NORMAL', note: 'ritmo base', mult: 1.0, hex: '#35c1ff' },
  { key: 'cansado', label: 'CANSADO', note: '-5% más lento', mult: 1.05, hex: '#ff8a1e' },
]

/** Paleta del formulario de creación de misiones. */
export const PREDEFINED_COLORS = [
  '#39ff88',
  '#35c1ff',
  '#ff4b3e',
  '#ff8a1e',
  '#b06bff',
  '#ffc700',
  '#d9334a',
  '#e0e0e0',
]

/** Clave de localStorage y versión del esquema persistido. */
export const STORAGE_KEY = 'runArcadeState'
export const STORAGE_VERSION = 2
