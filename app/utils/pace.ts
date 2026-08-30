/* ============================================================================
   RUN·ARCADE — Motor de ritmos (funciones puras)
   ----------------------------------------------------------------------------
   Deriva ritmos a partir de la marca de 10K, offsets por esfuerzo y energía.
   `buildPlan` genera el plan completo para la foto rápida. Sin estado.
   ============================================================================ */

import type { EnergyLevel, Mission, PaceKey, PlanBlock, PlanStep, RunPlan, UserSettings } from './types'
import { ENERGY_LEVELS } from './missions'
import { fmtPace } from './formatters'

/** Offsets (s/km) relativos al ritmo base para cada tipo de esfuerzo. */
export const OFFSETS: Record<PaceKey, number> = {
  warmup: 60,
  cooldown: 65,
  fartlekSlow: 55,
  recovery: 70,
  walk: 110,
  prog1: 60,
  prog2: 35,
  prog3: 12,
}

/** Ritmo base en s/km derivado de la marca de 10K. */
export function basePaceSec(time10kSec: number): number {
  return Math.round(time10kSec / 10)
}

/** Ritmo efectivo = (base + offset) ajustado por la energía del día. */
export function pace(baseSec: number, offsetKey: PaceKey, energyMult: number): number {
  return Math.round((baseSec + OFFSETS[offsetKey]) * energyMult)
}

/** Ritmo de un bloque "run" con offset propio. */
export function runPace(baseSec: number, offset: number, energyMult: number): number {
  return Math.round((baseSec + offset) * energyMult)
}

/** Factor de tolerancia para comparaciones de floats en tests (no usado en runtime). */
export function energyFromIndex(settings: UserSettings, levels: EnergyLevel[] = ENERGY_LEVELS): EnergyLevel {
  const idx = settings.energyIndex
  if (!Number.isInteger(idx) || idx < 0 || idx >= levels.length) {
    return levels[1] ?? levels[0]!
  }
  return levels[idx]!
}

/* -------------------------------------------------------------------------- */
/*  GENERADOR DE PLAN                                                          */
/* -------------------------------------------------------------------------- */

interface BlockContext {
  baseSec: number
  energyMult: number
  settings: UserSettings
  mission: Mission
}

function processBlock(block: PlanBlock, ctx: BlockContext, steps: PlanStep[]): void {
  const { baseSec, energyMult, settings, mission } = ctx

  switch (block.type) {
    case 'warmup': {
      const p = pace(baseSec, 'warmup', energyMult)
      const sec = block.value * 60
      steps.push({
        tag: 'WARM-UP',
        label: 'Calentamiento',
        meta: `${block.value} min · trote progresivo`,
        pace: p,
        km: sec / p,
        sec,
        hex: '#39ff88',
      })
      break
    }
    case 'cooldown': {
      const p = pace(baseSec, 'cooldown', energyMult)
      const sec = block.value * 60
      steps.push({
        tag: 'COOL-DOWN',
        label: 'Enfriamiento',
        meta: `${block.value} min · trote muy suave`,
        pace: p,
        km: sec / p,
        sec,
        hex: '#35c1ff',
      })
      break
    }
    case 'run': {
      const p = runPace(baseSec, block.offset, energyMult)
      const value = block.value_param ? settings[block.value_param] : block.value
      if (value === undefined) break
      const sec = block.unit === 'duration' ? value * 60 : value * p
      const km = block.unit === 'distance' ? value : sec / p
      const meta = block.metaTemplate.replace('{value}', String(value))
      steps.push({ tag: 'MAIN', label: block.label, meta, pace: p, km, sec, hex: mission.hex })
      break
    }
    case 'interval': {
      const pWork = runPace(baseSec, block.work_offset, energyMult)
      const pRec = pace(baseSec, block.rec_pace_offset, energyMult)
      const reps = settings[block.params.reps]
      const distM = block.params.dist ? settings[block.params.dist] : null
      const workS = block.params.work_s ?? (distM ? (distM / 1000) * pWork : 0)
      const recS = block.params.rec_s
      const totalWorkS = reps * (distM ? (distM / 1000) * pWork : workS)
      const totalRecS = (reps - 1) * recS
      const km = totalWorkS / pWork + totalRecS / pRec
      const sec = totalWorkS + totalRecS
      const meta = block.metaTemplate
        .replace('{reps}', String(reps))
        .replace('{dist}', String(distM))
        .replace('{work_s}', String(workS))
        .replace('{rec_s}', String(recS))
      steps.push({ tag: 'MAIN', label: block.label, meta, pace: pWork, km, sec, hex: mission.hex, recPace: pRec })
      break
    }
    case 'progressive': {
      const kmTotal = settings[block.param]
      const kmPart = kmTotal / 3
      const p1 = pace(baseSec, block.offsets[0]!, energyMult)
      const p3 = pace(baseSec, block.offsets[2]!, energyMult)
      const sec =
        kmPart * pace(baseSec, block.offsets[0]!, energyMult) +
        kmPart * pace(baseSec, block.offsets[1]!, energyMult) +
        kmPart * p3
      const meta = `${kmTotal} km (de ${fmtPace(p1)} a ${fmtPace(p3)}/km)`
      steps.push({ tag: 'MAIN', label: block.label, meta, pace: Math.round(sec / kmTotal), km: kmTotal, sec, hex: mission.hex })
      break
    }
    case 'hills': {
      const rp = pace(baseSec, block.rec_pace_offset, energyMult)
      const wp = runPace(baseSec, block.work_offset, energyMult)
      const reps = settings[block.params.reps]
      const workS = settings[block.params.work_s]
      const recS = workS * block.params.rec_multiplier
      const totalWorkS = reps * workS
      const totalRecS = (reps - 1) * recS
      const km = totalWorkS / wp + totalRecS / rp
      const sec = totalWorkS + totalRecS
      const meta = block.metaTemplate.replace('{reps}', String(reps)).replace('{work_s}', String(workS))
      steps.push({ tag: 'MAIN', label: block.label, meta, pace: null, km, sec, hex: mission.hex, recPace: rp })
      break
    }
    case 'pyramid': {
      const p = runPace(baseSec, block.work_offset, energyMult)
      const rp = pace(baseSec, block.rec_pace_offset, energyMult)
      const workS = block.params.steps_min.reduce((acc, min) => acc + min * 60, 0)
      const recS = (block.params.steps_min.length - 1) * block.params.rec_s
      const km = workS / p + recS / rp
      const sec = workS + recS
      const meta = block.metaTemplate.replace('{rec_s}', String(block.params.rec_s))
      steps.push({ tag: 'MAIN', label: block.label, meta, pace: p, km, sec, hex: mission.hex, recPace: rp })
      break
    }
    case 'extra': {
      steps.push({ tag: 'EXTRA', label: block.label, meta: block.meta, pace: null, km: block.km, sec: block.sec, hex: block.hex ?? '#ffe14d' })
      break
    }
  }
}

/** Genera el plan completo de una misión. Devuelve null si la misión no existe. */
export function buildPlan(mission: Mission | null, settings: UserSettings): RunPlan | null {
  if (!mission) return null

  const energy = energyFromIndex(settings)
  const ctx: BlockContext = {
    baseSec: basePaceSec(settings.time10k),
    energyMult: energy.mult,
    settings,
    mission,
  }

  const steps: PlanStep[] = []
  for (const block of mission.planConfig.blocks) {
    processBlock(block, ctx, steps)
  }

  const totalKm = steps.reduce((acc, s) => acc + s.km, 0)
  const totalSec = steps.reduce((acc, s) => acc + s.sec, 0)

  return { steps, totalKm, totalSec, tip: mission.tip, mission }
}
