import { describe, it, expect } from 'vitest';
import {
  summarizeTipPeriod,
  validateAllocationEdit,
  quincenaFor,
  tipAllocationsToCsv,
  type TipAllocation,
  type TipPeriod,
} from './tipsData';

const period = (over: Partial<TipPeriod> = {}): TipPeriod => ({
  id: 'p1', user_id: 'u1', label: 'Quincena 16–31 oct', start_date: '2026-10-16', end_date: '2026-10-31',
  status: 'draft', total_tips: 1_000_000, table_kept: 600_000, shared_pool: 400_000, orders_count: 300,
  computed_at: '2026-11-01T10:00:00Z', closed_at: null, ...over,
});

const alloc = (over: Partial<TipAllocation>): TipAllocation => ({
  id: Math.random().toString(), period_id: 'p1', staff_member_id: 's', staff_name: 'X', position: 'Mesero',
  tip_group: 'sala', days_worked: 10, hours_worked: 75, table_tips_generated: 0, table_tips_kept: 0,
  role_weight: 1, shared_points: 10, manager_factor: 1, factor_reason: null, shared_amount: 0, adjustment: 0,
  adjustment_reason: null, total_amount: 0, ...over,
});

describe('summarizeTipPeriod', () => {
  it('cuadra cuando lo pagado = lo recaudado y los ajustes netean a cero', () => {
    const s = summarizeTipPeriod(period(), [
      alloc({ total_amount: 625_000, adjustment: 25_000, adjustment_reason: 'doble turno' }),
      alloc({ total_amount: 375_000, adjustment: -25_000, adjustment_reason: 'cambio de turno', tip_group: 'cocina' }),
    ]);
    expect(s.isBalanced).toBe(true);
    expect(s.canClose).toBe(true);
    expect(s.adjustmentsCount).toBe(2);
    expect(s.byGroup[0]).toEqual({ group: 'sala', people: 1, amount: 625_000 });
  });

  it('no deja cerrar si un ajuste no tiene contrapartida', () => {
    const s = summarizeTipPeriod(period(), [
      alloc({ total_amount: 1_025_000, adjustment: 25_000, adjustment_reason: 'bono' }),
    ]);
    expect(s.canClose).toBe(false);
    expect(s.blockers.some(b => b.includes('ajustes suman 25000'))).toBe(true);
    expect(s.difference).toBe(25_000);
  });

  it('no deja cerrar una quincena sin calcular ni una ya cerrada', () => {
    expect(summarizeTipPeriod(period({ computed_at: null }), []).canClose).toBe(false);
    expect(summarizeTipPeriod(period({ status: 'closed' }), [alloc({ total_amount: 1_000_000 })]).canClose).toBe(false);
  });
});

describe('validateAllocationEdit', () => {
  it('exige motivo para cambiar el factor o ajustar', () => {
    expect(validateAllocationEdit({ manager_factor: 0.8, adjustment: 0 })).toMatch(/por qué/);
    expect(validateAllocationEdit({ manager_factor: 1, adjustment: 5000 })).toMatch(/motivo/);
    expect(validateAllocationEdit({ manager_factor: 0.8, factor_reason: 'tarde', adjustment: 0 })).toBeNull();
  });

  it('acota el factor entre 0 y 2', () => {
    expect(validateAllocationEdit({ manager_factor: 2.5, factor_reason: 'x', adjustment: 0 })).toMatch(/entre 0 y 2/);
  });
});

describe('quincenaFor', () => {
  it('primera y segunda quincena, incluido fin de mes corto', () => {
    expect(quincenaFor(new Date(2026, 9, 3))).toMatchObject({ start: '2026-10-01', end: '2026-10-15' });
    expect(quincenaFor(new Date(2026, 9, 20))).toMatchObject({ start: '2026-10-16', end: '2026-10-31' });
    expect(quincenaFor(new Date(2026, 1, 20))).toMatchObject({ start: '2026-02-16', end: '2026-02-28' });
  });
});

describe('tipAllocationsToCsv', () => {
  it('escapa el separador y las comillas en los motivos', () => {
    const csv = tipAllocationsToCsv(period(), [
      alloc({ staff_name: 'Sara Montoya', adjustment: 25_000, adjustment_reason: 'Doble turno; "UFC"', total_amount: 100_000 }),
    ]);
    expect(csv.split('\n')[2]).toContain('"Doble turno; ""UFC"""');
    expect(csv.split('\n')[1].split(';')).toHaveLength(14);
  });
});
