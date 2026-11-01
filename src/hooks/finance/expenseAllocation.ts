/**
 * Gastos en el P&L por devengo.
 *
 * Un arriendo de $30M que se paga el 5 no es un gasto del día 5: es $1M por
 * día del mes. Si se cargara el día del pago, la semana del 5 saldría en
 * pérdida y las demás infladas. Regla:
 *   · gasto fijo   → se reparte en partes iguales entre los días de su mes
 *   · gasto variable → cae completo en su fecha
 *   · los anulados no cuentan; pagado o pendiente da igual (es devengo, no caja)
 * La caja (cuándo sale la plata) la maneja el flujo de caja, no el P&L.
 */
export interface ExpenseForPnl {
  expense_date: string; // yyyy-MM-dd
  amount: number | string;
  is_fixed: boolean;
  status: string;
  category: string;
}

export interface ExpenseAllocation {
  total: number;
  byCategory: Record<string, number>;
  byDay: Record<string, number>;
}

const DAY_MS = 86_400_000;
const toUtc = (day: string) => Date.parse(`${day}T00:00:00Z`);
const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);

const daysInMonth = (day: string): number => {
  const [y, m] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};

export const allocateExpenses = (
  expenses: ExpenseForPnl[],
  fromDay: string,
  toDay: string,
): ExpenseAllocation => {
  const result: ExpenseAllocation = { total: 0, byCategory: {}, byDay: {} };
  const fromMs = toUtc(fromDay);
  const toMs = toUtc(toDay);
  const add = (day: string, category: string, amount: number) => {
    result.total += amount;
    result.byCategory[category] = (result.byCategory[category] || 0) + amount;
    result.byDay[day] = (result.byDay[day] || 0) + amount;
  };

  for (const e of expenses) {
    if (e.status === 'cancelled') continue;
    const amount = Number(e.amount) || 0;
    if (amount <= 0 || !e.expense_date) continue;
    if (!e.is_fixed) {
      const ms = toUtc(e.expense_date);
      if (ms >= fromMs && ms <= toMs) add(e.expense_date, e.category, amount);
      continue;
    }
    const n = daysInMonth(e.expense_date);
    const perDay = amount / n;
    const monthStart = toUtc(`${e.expense_date.slice(0, 7)}-01`);
    const start = Math.max(monthStart, fromMs);
    const end = Math.min(monthStart + (n - 1) * DAY_MS, toMs);
    for (let ms = start; ms <= end; ms += DAY_MS) add(fromUtc(ms), e.category, perDay);
  }
  return result;
};

/** Primer día del mes de un día operativo (para traer los fijos que se prorratean en el período). */
export const monthStartOf = (day: string): string => `${day.slice(0, 7)}-01`;

export const EXPENSE_CATEGORY_LABEL: Record<string, string> = {
  arriendo: 'Arriendo',
  servicios_publicos: 'Servicios públicos',
  nomina_prestaciones: 'Seguridad social y prestaciones',
  mercadeo: 'Mercadeo',
  mantenimiento: 'Mantenimiento',
  software_licencias: 'Software y licencias',
  comisiones: 'Comisiones (datáfono, plataformas)',
  impuestos: 'Impuestos y tasas',
  bancarios: 'Gastos bancarios',
  seguros: 'Seguros',
  domicilios: 'Domicilios',
  aseo_desechables: 'Aseo y desechables',
  otros: 'Otros',
};

export const EXPENSE_CATEGORIES = Object.keys(EXPENSE_CATEGORY_LABEL);
