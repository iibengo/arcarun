import { describe, it, expect } from 'vitest'
import { fmtPace, fmtDuration, fmtKm, levelLabel } from '../../app/utils/formatters'

describe('fmtPace', () => {
  it('formatea segundos a m:ss', () => {
    expect(fmtPace(240)).toBe('4:00')
    expect(fmtPace(2400)).toBe('40:00')
    expect(fmtPace(0)).toBe('0:00')
  })

  it('aplica padding de ceros a los segundos', () => {
    expect(fmtPace(245)).toBe('4:05')
    expect(fmtPace(301)).toBe('5:01')
    expect(fmtPace(299)).toBe('4:59')
  })

  it('nunca produce m:60 (segundos de 0 a 59)', () => {
    // Con entradas enteras, el resto módulo 60 nunca llega a 60.
    for (let sec = 0; sec <= 3600; sec += 7) {
      const out = fmtPace(sec)
      expect(out).toMatch(/^\d+:[0-5]\d$/)
    }
  })
})

describe('fmtDuration', () => {
  it('formatea minutos por debajo de 1 hora', () => {
    expect(fmtDuration(1200)).toBe('20 min')
    expect(fmtDuration(60)).toBe('1 min')
    expect(fmtDuration(0)).toBe('0 min')
  })

  it('formatea horas y minutos a partir de 1 hora', () => {
    expect(fmtDuration(4500)).toBe('1h 15m')
    expect(fmtDuration(3600)).toBe('1h 00m')
    expect(fmtDuration(4140)).toBe('1h 09m')
  })
})

describe('fmtKm', () => {
  it('formatea km con un decimal', () => {
    expect(fmtKm(8)).toBe('8.0 km')
    expect(fmtKm(10.584)).toBe('10.6 km')
    expect(fmtKm(0)).toBe('0.0 km')
  })
})

describe('levelLabel', () => {
  it('genera la etiqueta de nivel a partir de la marca de 10K', () => {
    expect(levelLabel(2400)).toBe('10K · 4:00/km')
    expect(levelLabel(1800)).toBe('10K · 3:00/km')
    expect(levelLabel(3600)).toBe('10K · 6:00/km')
  })
})
