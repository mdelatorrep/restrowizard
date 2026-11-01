import { describe, it, expect } from 'vitest';
import { calcShiftHours, calcShiftLaborCost } from './laborCost';

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
