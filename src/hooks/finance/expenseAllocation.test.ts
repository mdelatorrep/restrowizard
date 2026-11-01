import { describe, it, expect } from 'vitest';
import { allocateExpenses, monthEndOf } from './expenseAllocation';

const rent = { expense_date: '2026-10-05', amount: 31_000_000, is_fixed: true, status: 'paid', category: 'arriendo' };

describe('allocateExpenses (P&L por devengo)', () => {
  it('el arriendo fijo se reparte por día del mes, no el día del pago', () => {
    // Octubre tiene 31 días → $1M por día. Semana del 19 al 25 → $7M.
    const a = allocateExpenses([rent], '2026-10-19', '2026-10-25');
    expect(a.total).toBeCloseTo(7_000_000);
    expect(a.byCategory.arriendo).toBeCloseTo(7_000_000);
    expect(Object.keys(a.byDay)).toHaveLength(7);
  });

  it('el mes completo suma exactamente el gasto', () => {
    expect(allocateExpenses([rent], '2026-10-01', '2026-10-31').total).toBeCloseTo(31_000_000);
  });

  it('un período que cruza meses solo toma los días de cada mes', () => {
    const nov = { ...rent, expense_date: '2026-11-05', amount: 30_000_000 }; // 30 días → $1M/día
    const a = allocateExpenses([rent, nov], '2026-10-30', '2026-11-02');
    expect(a.total).toBeCloseTo(2_000_000 + 2_000_000);
  });

  it('el gasto variable cae completo en su fecha', () => {
    const repair = { expense_date: '2026-10-21', amount: 850_000, is_fixed: false, status: 'pending', category: 'mantenimiento' };
    expect(allocateExpenses([repair], '2026-10-19', '2026-10-25').total).toBe(850_000);
    expect(allocateExpenses([repair], '2026-10-22', '2026-10-25').total).toBe(0);
  });

  it('los anulados no cuentan', () => {
    expect(allocateExpenses([{ ...rent, status: 'cancelled' }], '2026-10-01', '2026-10-31').total).toBe(0);
  });
});

describe('ventana de consulta de gastos', () => {
  it('el arriendo fechado el 5 ya se devenga el día 1 (hay que traerlo aunque el período corte hoy)', () => {
    const nov = { expense_date: '2026-11-05', amount: 30_000_000, is_fixed: true, status: 'pending', category: 'arriendo' };
    expect(allocateExpenses([nov], '2026-11-01', '2026-11-01').total).toBeCloseTo(1_000_000);
    expect(monthEndOf('2026-11-01')).toBe('2026-11-30');
    expect(monthEndOf('2028-02-10')).toBe('2028-02-29');
  });
});
