import { describe, expect, it } from 'vitest';
import { buildBusinessHours, buildReservationSlots, isValidSlug, normalizeWhatsapp, slugify, validDishes } from './quickSetup';

describe('alta guiada (C-07)', () => {
  it('genera el slug desde el nombre', () => {
    expect(slugify('Clutch Sports Bar & Grill')).toBe('clutch-sports-bar-grill');
    expect(slugify('Café Ñandú')).toBe('cafe-nandu');
    expect(isValidSlug('clutch-sports-bar-grill')).toBe(true);
    expect(isValidSlug('-mal')).toBe(false);
  });

  it('arma turnos de reserva dentro del horario', () => {
    expect(buildReservationSlots('12:00', '16:00')).toEqual(['12:00', '13:00', '14:00', '15:00']);
    expect(buildReservationSlots('11:30', '14:00')).toEqual(['12:00', '13:00']);
    expect(buildReservationSlots('22:00', '02:00')).toEqual(['22:00', '23:00']);
  });

  it('marca los días cerrados', () => {
    const hours = buildBusinessHours('12:00', '22:00', ['monday']);
    expect(hours.monday.closed).toBe(true);
    expect(hours.friday).toEqual({ open: '12:00', close: '22:00', closed: false });
  });

  it('descarta platos sin nombre o sin precio', () => {
    expect(validDishes([{ name: 'A', category: 'X', price: '1000' }, { name: '', category: 'X', price: '1' }, { name: 'B', category: 'X', price: '' }])).toHaveLength(1);
  });

  it('normaliza el WhatsApp de Colombia', () => {
    expect(normalizeWhatsapp('300 123 4567')).toBe('573001234567');
    expect(normalizeWhatsapp('')).toBeNull();
  });
});
