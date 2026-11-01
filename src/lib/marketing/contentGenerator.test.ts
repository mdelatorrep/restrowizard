import { describe, it, expect } from 'vitest';
import {
  buildMoments, formatTime, generateContent, pickHeroItems, slowestWeekday, suggestOffer, suggestedPublishTimes,
  type MenuOpportunity, type MarketingMoment,
} from './contentGenerator';

const item = (over: Partial<MenuOpportunity>): MenuOpportunity => ({
  id: over.name || 'x', name: 'x', category: 'Platos', price: 50_000, net_price: 46_296, cost: 13_000,
  margin: 33_296, margin_pct: 71.9, units: 100, revenue: 0, contribution: 0, has_cost: true, quadrant: 'estrella', ...over,
});

// Valores reales del demo (precio con impoconsumo 8 % incluido)
const picada = item({ name: 'Picada Clutch (para 4)', category: 'Para compartir', price: 98_000, net_price: 90_741, cost: 26_500, margin: 64_241, quadrant: 'rompecabezas' });
const burger = item({ name: 'Clutch Burger', category: 'Hamburguesas', price: 46_000, net_price: 42_593, cost: 12_500, margin: 30_093, quadrant: 'estrella' });
const cubeta = item({ name: 'Cubeta x6 nacionales', category: 'Cervezas', price: 48_000, net_price: 44_444, cost: 19_950, margin: 24_494, quadrant: 'estrella' });
const aguardiente = item({ name: 'Media de aguardiente', category: 'Licores', price: 85_000, net_price: 78_704, cost: 20_625, margin: 58_079, quadrant: 'rompecabezas' });
const cerveza = item({ name: 'Cerveza nacional', category: 'Cervezas', price: 9_000, net_price: 8_333, cost: 3_200, margin: 5_133, quadrant: 'caballo' });
const pancakes = item({ name: 'Pancakes de arándanos', category: 'Brunch', price: 29_000, net_price: 26_852, cost: 4_350, margin: 22_502, quadrant: 'rompecabezas' });
const menu = [picada, burger, cubeta, aguardiente, cerveza, pancakes];

const nfl: MarketingMoment = { key: 'ev:1', date: '2026-11-08', time: '19:20:00', title: 'Sunday Night Football', kind: 'deporte', lift: 1.35 };

describe('qué empujar en cada momento', () => {
  it('en un partido: el plato para compartir que más necesita empujón + la bebida de más margen', () => {
    const { food, drink } = pickHeroItems(menu, nfl);
    expect(food?.name).toBe('Picada Clutch (para 4)');
    expect(drink?.name).toBe('Media de aguardiente');
  });
  it('nunca empuja un caballo de batalla ni un plato sin costo', () => {
    const { drink } = pickHeroItems([burger, cerveza], nfl);
    expect(drink).toBeNull();
  });
  it('en brunch elige el plato de brunch', () => {
    expect(pickHeroItems(menu, { kind: 'brunch' }).food?.name).toBe('Pancakes de arándanos');
  });
});

describe('oferta con piso de margen', () => {
  it('el combo nunca baja del 60 % de margen y redondea a miles', () => {
    const o = suggestOffer(picada, aguardiente, 60)!;
    expect(o.type).toBe('combo');
    expect(o.offerPrice % 1000).toBe(0);
    expect(o.marginPctAfter!).toBeGreaterThanOrEqual(60);
    expect(o.discountPct).toBeLessThanOrEqual(15);
  });
  it('si el margen no da para 5 % de descuento, ofrece valor agregado', () => {
    const thin = item({ name: 'Plato caro', price: 30_000, net_price: 27_778, cost: 11_000, margin: 16_778 });
    const o = suggestOffer(thin, cerveza, 60)!;
    expect(o.type).toBe('valor_agregado');
    expect(o.offerPrice).toBe(o.regularPrice);
  });
});

describe('contenido generado', () => {
  const c = generateContent({ restaurantName: 'Clutch Sports Bar & Grill', city: 'Medellín', neighborhood: 'Laureles', reservationUrl: 'https://restrowizard.co/p/clutch/reservas' }, nfl, menu);
  it('cuatro piezas con hora sugerida antes del partido', () => {
    expect(c.pieces.map(p => p.channel)).toEqual(['instagram', 'story', 'whatsapp', 'google']);
    expect(c.pieces[0].publishAt).toBe('2026-11-08T16:20');
    expect(c.pieces[1].publishAt).toBe('2026-11-08T18:20');
    expect(c.pieces[2].publishAt).toBe('2026-11-08T12:00'); // partido de noche: WhatsApp al mediodía
  });
  it('el post lleva el partido, la hora, el plato, la oferta, el link y hashtags', () => {
    const ig = c.pieces[0].body;
    expect(ig).toContain('Sunday Night Football');
    expect(ig).toContain('7:20 p. m.');
    expect(ig).toContain('Picada Clutch (para 4)');
    expect(ig).toContain('Combo');
    expect(ig).toContain('https://restrowizard.co/p/clutch/reservas');
    expect(ig).toContain('#ClutchSportsBarGrill');
    expect(ig).toContain('#Medellin');
    expect(ig).toContain('#NFL');
  });
  it('el WhatsApp personaliza y permite darse de baja (habeas data)', () => {
    expect(c.pieces[2].body).toContain('{{nombre}}');
    expect(c.pieces[2].body).toContain('responde NO');
  });
});

describe('momentos y horas', () => {
  it('formatea la hora a la colombiana', () => {
    expect(formatTime('19:15:00')).toBe('7:15 p. m.');
    expect(formatTime('12:00')).toBe('12 p. m.');
    expect(formatTime('11:30')).toBe('11:30 a. m.');
  });
  it('partido de mediodía: WhatsApp 4 h antes', () => {
    expect(suggestedPublishTimes({ ...nfl, time: '14:00' }).whatsapp).toBe('2026-11-08T10:00');
  });
  it('agrega el día flojo cuando no tiene evento y ordena por fecha', () => {
    const m = buildMoments(
      [{ id: '1', event_date: '2026-11-02', start_time: '19:15', title: 'MNF', category: 'deporte', expected_lift: 1.3 },
       { id: '2', event_date: '2026-11-03', start_time: null, title: 'Algo', category: 'otro', expected_lift: null }],
      '2026-11-01', 2 /* martes */, 14, true,
    );
    // martes 3 tiene evento → solo el martes 10 como día flojo
    expect(m.filter(x => x.kind === 'dia_flojo').map(x => x.date)).toEqual(['2026-11-10']);
    expect(m.filter(x => x.kind === 'brunch').map(x => x.date)).toEqual(['2026-11-07', '2026-11-14']);
    expect(m[0].date).toBe('2026-11-02');
  });
  it('día más flojo = menor venta promedio con al menos 2 semanas de datos', () => {
    const daily = [
      { date: '2026-10-20', total_revenue: 5 }, { date: '2026-10-27', total_revenue: 7 }, // martes
      { date: '2026-10-19', total_revenue: 6 }, { date: '2026-10-26', total_revenue: 8 }, // lunes
      { date: '2026-10-24', total_revenue: 1 }, // sábado con un solo dato: no cuenta
    ];
    expect(slowestWeekday(daily)).toBe(2);
  });
});

describe('ortografía del contenido', () => {
  it('no deja doble punto después de "p. m."', () => {
    const c = generateContent({ restaurantName: 'Clutch' }, { ...nfl, time: '12:00:00', title: 'NFL Sunday' }, menu);
    for (const p of c.pieces) expect(p.body).not.toMatch(/\.\s*\./);
  });
});
