import { describe, it, expect } from 'vitest';
import { calcShiftHours, calcShiftLaborCost, calcShiftHoursElapsed } from './laborCost';

describe('calcShiftHours', () => {
  it('turno diurno normal', () => {
    expect(calcShiftHours({ start_time: '13:00:00', end_time: '21:00:00', break_minutes: 30 })).toBe(7.5);
  });

  it('B-46: turno que cruza la medianoche no cuesta $0', () => {
    // 18:00 → 02:00 = 8h, menos 30 min de descanso
    expect(calcShiftHours({ start_time: '18:00:00', end_time: '02:00:00', break_minutes: 30 })).toBe(7.5);
  });

  it('cierre exacto a medianoche', () => {
    expect(calcShiftHours({ start_time: '16:00:00', end_time: '00:00:00' })).toBe(8);
  });

  it('usa la hora real si existe', () => {
    expect(
      calcShiftHours({ start_time: '18:00', end_time: '02:00', actual_start_time: '18:30', actual_end_time: '02:00' })
    ).toBe(7.5);
  });

  it('sin horas → 0', () => {
    expect(calcShiftHours({ start_time: null, end_time: '02:00' })).toBe(0);
  });
});

describe('calcShiftLaborCost', () => {
  it('turno de cierre de bar se costea completo', () => {
    expect(calcShiftLaborCost({ start_time: '18:00', end_time: '02:00' }, 10000)).toBe(80000);
  });

  it('la tarifa del turno prevalece sobre la base', () => {
    expect(calcShiftLaborCost({ start_time: '10:00', end_time: '12:00', hourly_rate_override: 15000 }, 10000)).toBe(30000);
  });
});

describe('calcShiftHoursElapsed (día en curso)', () => {
  const night = { shift_date: '2026-10-31', start_time: '18:00', end_time: '02:00', break_minutes: 0 };
  it('a las 8 p. m. un turno de 18:00 a 02:00 lleva 2 h', () => {
    // 20:00 Bogotá = 01:00 UTC del día siguiente
    expect(calcShiftHoursElapsed(night, Date.parse('2026-11-01T01:00:00Z'))).toBeCloseTo(2);
  });
  it('antes de empezar 0 h y después del cierre las 8 h completas', () => {
    expect(calcShiftHoursElapsed(night, Date.parse('2026-10-31T20:00:00Z'))).toBe(0);
    expect(calcShiftHoursElapsed(night, Date.parse('2026-11-01T12:00:00Z'))).toBeCloseTo(8);
  });
  it('prorratea el descanso', () => {
    const day = { shift_date: '2026-11-01', start_time: '10:00', end_time: '18:00', break_minutes: 60 };
    // mitad del turno (14:00 Bogotá = 19:00 UTC): 4 h brutas → 3,5 h netas
    expect(calcShiftHoursElapsed(day, Date.parse('2026-11-01T19:00:00Z'))).toBeCloseTo(3.5);
  });
  it('turno de madrugada (01:00-05:00) cae en la madrugada siguiente del mismo día operativo', () => {
    const late = { shift_date: '2026-10-31', start_time: '01:00', end_time: '05:00', break_minutes: 0 };
    // 03:00 Bogotá del 1-nov = 08:00 UTC
    expect(calcShiftHoursElapsed(late, Date.parse('2026-11-01T08:00:00Z'))).toBeCloseTo(2);
  });
});
