/**
 * Finanzas integrales: tipos y reglas puras (sin React ni Supabase) para
 * gastos, cuentas por pagar, flujo de caja y conciliación.
 */
import { addBusinessDays } from '@/lib/businessDay';

export type ExpenseStatus = 'pending' | 'paid' | 'cancelled';

export interface Expense {
  id: string;
  expense_date: string;
  category: string;
  description: string;
  vendor: string | null;
  amount: number;
  is_fixed: boolean;
  status: ExpenseStatus;
  due_date: string | null;
  paid_at: string | null;
  payment_method: string | null;
  account_id: string | null;
  recurrence: 'none' | 'monthly';
  recurrence_parent: string | null;
  notes: string | null;
}

export interface FinanceAccount {
  id: string;
  name: string;
  account_type: 'bank' | 'cash' | 'wallet';
  balance: number;
  balance_as_of: string;
  is_active: boolean;
}

export interface FinanceSettings {
  card_fee_pct: number;
  card_withholding_pct: number;
  card_settlement_days: number;
  digital_fee_pct: number;
  rappi_commission_pct: number;
  rappi_settlement_days: number;
  supplier_payment_days: number;
  min_cash_buffer: number;
}

export const DEFAULT_FINANCE_SETTINGS: FinanceSettings = {
  card_fee_pct: 3,
  card_withholding_pct: 0,
  card_settlement_days: 1,
  digital_fee_pct: 0,
  rappi_commission_pct: 25,
  rappi_settlement_days: 14,
  supplier_payment_days: 20,
  min_cash_buffer: 0,
};

export interface SupplierInvoiceDue {
  id: string;
  supplier_name: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  total_amount: number | null;
  status: string | null;
}

export const PAYMENT_METHODS = ['Transferencia', 'Efectivo', 'Tarjeta', 'PSE', 'Cheque', 'Débito automático'] as const;

// ── Cuentas por pagar ──────────────────────────────────────────────────────

export type AgingBucket = 'overdue' | 'week' | 'fortnight' | 'month' | 'later' | 'no_date';

export const AGING_LABEL: Record<AgingBucket, string> = {
  overdue: 'Vencido',
  week: 'Próximos 7 días',
  fortnight: '8 a 15 días',
  month: '16 a 30 días',
  later: 'Más de 30 días',
  no_date: 'Sin fecha',
};

const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

export const agingBucket = (dueDate: string | null | undefined, today: string): AgingBucket => {
  if (!dueDate) return 'no_date';
  const d = daysBetween(today, dueDate);
  if (d < 0) return 'overdue';
  if (d <= 7) return 'week';
  if (d <= 15) return 'fortnight';
  if (d <= 30) return 'month';
  return 'later';
};

export interface Payable {
  key: string;
  source: 'invoice' | 'expense';
  id: string;
  label: string;
  detail: string;
  amount: number;
  due_date: string | null;
  days_to_due: number | null;
  bucket: AgingBucket;
}

/**
 * Une facturas de proveedor sin pagar y gastos pendientes en una sola lista,
 * ordenada por vencimiento (lo vencido primero). Una factura sin fecha de
 * vencimiento usa fecha de factura + plazo habitual de pago a proveedores.
 */
export const buildPayables = (
  invoices: SupplierInvoiceDue[],
  expenses: Expense[],
  today: string,
  supplierPaymentDays = DEFAULT_FINANCE_SETTINGS.supplier_payment_days,
): Payable[] => {
  const items: Payable[] = [];
  for (const inv of invoices) {
    if (['paid', 'rejected', 'cancelled'].includes(inv.status || '')) continue;
    const amount = Number(inv.total_amount) || 0;
    if (amount <= 0) continue;
    const due = inv.due_date || (inv.invoice_date ? addBusinessDays(inv.invoice_date, supplierPaymentDays) : null);
    items.push({
      key: `invoice:${inv.id}`, source: 'invoice', id: inv.id,
      label: inv.supplier_name || 'Proveedor',
      detail: inv.invoice_number ? `Factura ${inv.invoice_number}` : 'Factura',
      amount, due_date: due,
      days_to_due: due ? daysBetween(today, due) : null,
      bucket: agingBucket(due, today),
    });
  }
  for (const e of expenses) {
    if (e.status !== 'pending') continue;
    const due = e.due_date || e.expense_date;
    items.push({
      key: `expense:${e.id}`, source: 'expense', id: e.id,
      label: e.vendor || e.description,
      detail: e.vendor ? e.description : 'Gasto',
      amount: Number(e.amount) || 0, due_date: due,
      days_to_due: due ? daysBetween(today, due) : null,
      bucket: agingBucket(due, today),
    });
  }
  return items.sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999') || b.amount - a.amount);
};

export const summarizeAging = (payables: Payable[]) => {
  const totals = { overdue: 0, week: 0, fortnight: 0, month: 0, later: 0, no_date: 0 } as Record<AgingBucket, number>;
  for (const p of payables) totals[p.bucket] += p.amount;
  return { totals, total: payables.reduce((s, p) => s + p.amount, 0), count: payables.length };
};

// ── Gastos ────────────────────────────────────────────────────────────────

export const summarizeExpenses = (expenses: Expense[]) => {
  const active = expenses.filter(e => e.status !== 'cancelled');
  const sum = (xs: Expense[]) => xs.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  return {
    total: sum(active),
    fixed: sum(active.filter(e => e.is_fixed)),
    variable: sum(active.filter(e => !e.is_fixed)),
    pending: sum(active.filter(e => e.status === 'pending')),
    paid: sum(active.filter(e => e.status === 'paid')),
  };
};

// ── Flujo de caja ─────────────────────────────────────────────────────────

export interface CashFlowWeek {
  week_start: string;
  week_end: string;
  opening: number;
  inflows: number;
  outflows: number;
  net: number;
  closing: number;
  by_kind: Record<string, number>;
}

export interface CashFlowProjection {
  as_of: string;
  horizon_end: string;
  opening_balance: number;
  balance_as_of: string | null;
  accounts_count: number;
  min_cash_buffer: number;
  weeks: CashFlowWeek[];
  lowest: { week_start: string; closing: number } | null;
  first_below_buffer: string | null;
  upcoming: { day: string; kind: string; label: string; amount: number }[];
  assumptions: Record<string, number>;
}

export const CASH_FLOW_KIND_LABEL: Record<string, string> = {
  in_counter: 'Ventas de contado y billeteras',
  in_card: 'Depósitos datáfono',
  in_rappi: 'Liquidaciones Rappi',
  out_suppliers: 'Facturas de proveedores',
  out_purchases: 'Compras de insumos proyectadas',
  out_expenses: 'Gastos (arriendo, servicios, otros)',
  out_payroll: 'Nómina (quincenas)',
  out_tips: 'Propinas al equipo',
  out_taxes: 'Impoconsumo',
};

export const CASH_FLOW_INFLOW_KINDS = ['in_counter', 'in_card', 'in_rappi'];
export const CASH_FLOW_OUTFLOW_KINDS = ['out_suppliers', 'out_purchases', 'out_payroll', 'out_tips', 'out_expenses', 'out_taxes'];

/** Lectura ejecutiva del flujo: la frase que el dueño necesita leer primero. */
export const cashFlowHeadline = (cf: CashFlowProjection): { tone: 'ok' | 'warn' | 'risk'; text: string } => {
  const lowest = cf.lowest?.closing ?? cf.opening_balance;
  if (cf.accounts_count === 0) {
    return { tone: 'warn', text: 'Registra el saldo de tus cuentas para ver cuánta plata vas a tener cada semana.' };
  }
  if (lowest < 0) {
    return { tone: 'risk', text: `La caja queda en negativo la semana del ${cf.lowest?.week_start}: hay que mover pagos o conseguir fondos antes.` };
  }
  if (cf.first_below_buffer) {
    return { tone: 'warn', text: `La semana del ${cf.first_below_buffer} el saldo baja de tu colchón mínimo.` };
  }
  return { tone: 'ok', text: 'Con lo proyectado, la caja alcanza para todos los pagos de las próximas semanas.' };
};

// ── Conciliación ──────────────────────────────────────────────────────────

export type SettlementChannel = 'card' | 'rappi' | 'digital';

export const CHANNEL_LABEL: Record<SettlementChannel, string> = {
  card: 'Datáfono',
  rappi: 'Rappi',
  digital: 'Nequi / QR / transferencias',
};

export interface ReconciliationChannel {
  channel: SettlementChannel;
  expected_gross: number;
  expected_net: number;
  covered_expected_net: number;
  reported_net: number;
  difference: number;
  unreported_net: number;
  unreported_days: number;
  issues: number;
}

export interface ReconciliationSettlement {
  id: string;
  channel: SettlementChannel;
  period_start: string;
  period_end: string;
  deposit_date: string | null;
  reference: string | null;
  notes: string | null;
  gross_reported: number | null;
  fees_reported: number | null;
  withholdings_reported: number | null;
  net_deposited: number;
  expected_gross: number;
  expected_net: number;
  difference: number;
  state: 'ok' | 'short' | 'over';
}

export interface Reconciliation {
  from: string;
  to: string;
  settings: Record<string, number>;
  channels: ReconciliationChannel[];
  settlements: ReconciliationSettlement[];
  cash: { sessions: number; expected: number; counted: number; difference: number; sessions_with_difference: number };
  cash_sessions: { id: string; day: string; cashier: string; expected: number; counted: number; difference: number }[];
}

export const SETTLEMENT_STATE_LABEL: Record<ReconciliationSettlement['state'], string> = {
  ok: 'Cuadra',
  short: 'Faltante',
  over: 'Sobrante',
};
