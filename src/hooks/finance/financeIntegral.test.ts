import { describe, it, expect } from 'vitest';
import { agingBucket, buildPayables, summarizeAging, summarizeExpenses, cashFlowHeadline, type Expense, type CashFlowProjection } from './financeIntegral';

const today = '2026-11-01';
const exp = (over: Partial<Expense>): Expense => ({
  id: 'e', expense_date: '2026-11-05', category: 'arriendo', description: 'Arriendo noviembre', vendor: 'Inmobiliaria',
  amount: 30_000_000, is_fixed: true, status: 'pending', due_date: '2026-11-05', paid_at: null, payment_method: null,
  account_id: null, recurrence: 'none', recurrence_parent: null, notes: null, ...over,
});

describe('cuentas por pagar', () => {
  it('clasifica por vencimiento', () => {
    expect(agingBucket('2026-10-28', today)).toBe('overdue');
    expect(agingBucket('2026-11-01', today)).toBe('week');
    expect(agingBucket('2026-11-08', today)).toBe('week');
    expect(agingBucket('2026-11-09', today)).toBe('fortnight');
    expect(agingBucket('2026-11-25', today)).toBe('month');
    expect(agingBucket('2026-12-15', today)).toBe('later');
    expect(agingBucket(null, today)).toBe('no_date');
  });

  it('une facturas sin pagar y gastos pendientes, lo vencido primero', () => {
    const list = buildPayables(
      [
        { id: 'i1', supplier_name: 'Carnes El Rodeo', invoice_number: 'FV-1', invoice_date: '2026-10-10', due_date: '2026-10-25', total_amount: 3_600_000, status: 'pending' },
        { id: 'i2', supplier_name: 'Pagada', invoice_number: 'FV-2', invoice_date: '2026-10-10', due_date: '2026-10-25', total_amount: 1_000, status: 'paid' },
        { id: 'i3', supplier_name: 'Sin vencimiento', invoice_number: 'FV-3', invoice_date: '2026-10-20', due_date: null, total_amount: 500_000, status: 'confirmed' },
      ],
      [exp({ id: 'e1' }), exp({ id: 'e2', status: 'paid', paid_at: '2026-10-05' })],
      today,
      20,
    );
    expect(list.map(p => p.key)).toEqual(['invoice:i1', 'expense:e1', 'invoice:i3']);
    expect(list[0].bucket).toBe('overdue');
    expect(list[0].days_to_due).toBe(-7);
    expect(list[2].due_date).toBe('2026-11-09'); // fecha de factura + 20 días
    const s = summarizeAging(list);
    expect(s.total).toBe(34_100_000);
    expect(s.totals.overdue).toBe(3_600_000);
  });
});

describe('gastos', () => {
  it('separa fijos, variables, pagados y pendientes; ignora anulados', () => {
    const s = summarizeExpenses([
      exp({ amount: 30_000_000 }),
      exp({ id: 'b', is_fixed: false, amount: 800_000, status: 'paid', paid_at: '2026-11-01' }),
      exp({ id: 'c', amount: 99, status: 'cancelled' }),
    ]);
    expect(s).toEqual({ total: 30_800_000, fixed: 30_000_000, variable: 800_000, pending: 30_000_000, paid: 800_000 });
  });
});

describe('lectura del flujo de caja', () => {
  const base: CashFlowProjection = {
    as_of: today, horizon_end: '2027-01-30', opening_balance: 40_000_000, balance_as_of: today, accounts_count: 2,
    min_cash_buffer: 15_000_000, weeks: [], lowest: { week_start: '2026-11-15', closing: 22_000_000 },
    first_below_buffer: null, upcoming: [], assumptions: {},
  };
  it('sin cuentas pide el saldo primero', () => {
    expect(cashFlowHeadline({ ...base, accounts_count: 0 }).tone).toBe('warn');
  });
  it('saldo negativo es riesgo y dice la semana', () => {
    const h = cashFlowHeadline({ ...base, lowest: { week_start: '2026-11-15', closing: -3_000_000 } });
    expect(h.tone).toBe('risk');
    expect(h.text).toContain('2026-11-15');
  });
  it('bajo el colchón es advertencia; todo bien es ok', () => {
    expect(cashFlowHeadline({ ...base, first_below_buffer: '2026-11-15' }).tone).toBe('warn');
    expect(cashFlowHeadline(base).tone).toBe('ok');
  });
});
