import { describe, it, expect } from 'vitest';
import {
  businessDayOf, todayBusinessDay, addBusinessDays, businessDayStartIso,
  businessRangeIso, elapsedInBusinessDay,
} from './businessDay';

describe('día operativo (Bogotá, corte 6 a. m.)', () => {
  it('una venta a la 1:30 a. m. del domingo es del sábado', () => {
    // 01:30 Bogotá = 06:30 UTC
    expect(businessDayOf('2026-11-01T06:30:00Z')).toBe('2026-10-31');
  });

  it('a las 8 p. m. sigue siendo el mismo día aunque en UTC ya sea mañana', () => {
    // 20:00 Bogotá del 31 = 01:00 UTC del 1
    expect(businessDayOf('2026-11-01T01:00:00Z')).toBe('2026-10-31');
  });

  it('a las 6:00 a. m. en punto empieza el día nuevo', () => {
    expect(businessDayOf('2026-11-01T11:00:00Z')).toBe('2026-11-01');
    expect(businessDayOf('2026-11-01T10:59:59Z')).toBe('2026-10-31');
  });

  it('el día empieza a las 11:00 UTC y la ventana excluye el corte siguiente', () => {
    expect(businessDayStartIso('2026-11-01')).toBe('2026-11-01T11:00:00.000Z');
    expect(businessRangeIso('2026-10-26', '2026-11-01')).toEqual({
      from: '2026-10-26T11:00:00.000Z',
      toExclusive: '2026-11-02T11:00:00.000Z',
    });
  });

  it('suma días cruzando fin de mes', () => {
    expect(addBusinessDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addBusinessDays('2026-11-01', -6)).toBe('2026-10-26');
  });

  it('hoy y tiempo transcurrido', () => {
    const now = new Date('2026-11-01T17:30:00Z'); // 12:30 Bogotá
    expect(todayBusinessDay(now)).toBe('2026-11-01');
    expect(elapsedInBusinessDay(now)).toBe(6.5 * 3_600_000);
  });
});
