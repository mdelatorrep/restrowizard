/**
 * Propinas — tipos y reglas puras (testeables sin React ni Supabase).
 *
 * El cálculo vive en la base (RPC compute_tip_period / close_tip_period) para que
 * sea una sola verdad. Aquí solo está lo que la pantalla necesita para explicar
 * el resultado y para impedir que el gerente cierre una quincena que no cuadra.
 */

export type TipGroup = 'sala' | 'barra' | 'cocina' | 'apoyo' | 'gerencia' | 'excluido';

export interface TipPeriod {
  id: string;
  user_id: string;
  label: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'closed';
  total_tips: number;
  table_kept: number;
  shared_pool: number;
  orders_count: number;
  computed_at: string | null;
  closed_at: string | null;
}

export interface TipAllocation {
  id: string;
  period_id: string;
  staff_member_id: string;
  staff_name: string;
  position: string | null;
  tip_group: TipGroup | null;
  days_worked: number;
  hours_worked: number;
  table_tips_generated: number;
  table_tips_kept: number;
  role_weight: number;
  shared_points: number;
  manager_factor: number;
  factor_reason: string | null;
  shared_amount: number;
  adjustment: number;
  adjustment_reason: string | null;
  total_amount: number;
}

export interface TipPolicy {
  user_id: string;
  table_share_pct: number;
  pool_basis: 'days' | 'hours';
  rounding: number;
}

export interface TipRoleWeight {
  id: string;
  user_id: string;
  position: string;
  tip_group: TipGroup;
  weight: number;
  earns_table_tips: boolean;
}

export const TIP_GROUP_LABEL: Record<TipGroup, string> = {
  sala: 'Sala',
  barra: 'Barra',
  cocina: 'Cocina',
  apoyo: 'Apoyo',
  gerencia: 'Gerencia',
  excluido: 'No participa',
};

const num = (v: unknown) => Number(v) || 0;

export interface TipPeriodSummary {
  people: number;
  totalPaid: number;
  adjustmentsNet: number;
  adjustmentsCount: number;
  difference: number; // pagado − recaudado
  isBalanced: boolean;
  canClose: boolean;
  blockers: string[];
  byGroup: { group: TipGroup; people: number; amount: number }[];
}

/**
 * Lo que la pantalla muestra arriba y lo que decide si "Cerrar quincena" se habilita.
 * Espeja las validaciones de close_tip_period: ajustes que suman 0 y pagado = recaudado.
 */
export const summarizeTipPeriod = (period: TipPeriod | null, allocations: TipAllocation[]): TipPeriodSummary => {
  const totalPaid = allocations.reduce((s, a) => s + num(a.total_amount), 0);
  const adjustmentsNet = allocations.reduce((s, a) => s + num(a.adjustment), 0);
  const adjustmentsCount = allocations.filter(a => num(a.adjustment) !== 0).length;
  const collected = num(period?.total_tips);
  const difference = Math.round(totalPaid - collected);

  const groups = new Map<TipGroup, { people: number; amount: number }>();
  for (const a of allocations) {
    const g = (a.tip_group || 'sala') as TipGroup;
    const cur = groups.get(g) || { people: 0, amount: 0 };
    cur.people += 1;
    cur.amount += num(a.total_amount);
    groups.set(g, cur);
  }

  const blockers: string[] = [];
  if (!period) blockers.push('Selecciona una quincena');
  else {
    if (period.status === 'closed') blockers.push('La quincena ya está cerrada');
    if (!period.computed_at) blockers.push('Calcula la liquidación antes de cerrar');
    if (Math.round(adjustmentsNet) !== 0) {
      blockers.push(`Los ajustes suman ${Math.round(adjustmentsNet)}: lo que se le suma a alguien se le debe restar a otro`);
    }
    if (period.computed_at && difference !== 0) {
      blockers.push('Lo que se paga no cuadra con lo recaudado: recalcula la liquidación');
    }
  }

  return {
    people: allocations.length,
    totalPaid,
    adjustmentsNet,
    adjustmentsCount,
    difference,
    isBalanced: difference === 0,
    canClose: blockers.length === 0,
    blockers,
    byGroup: [...groups.entries()]
      .map(([group, v]) => ({ group, ...v }))
      .sort((a, b) => b.amount - a.amount),
  };
};

/** Un ajuste o un factor distinto de 1 sin motivo no se guarda (la base también lo exige). */
export const validateAllocationEdit = (edit: {
  manager_factor: number;
  factor_reason?: string | null;
  adjustment: number;
  adjustment_reason?: string | null;
}): string | null => {
  if (!Number.isFinite(edit.manager_factor) || edit.manager_factor < 0 || edit.manager_factor > 2) {
    return 'El factor debe estar entre 0 y 2';
  }
  if (edit.manager_factor !== 1 && !edit.factor_reason?.trim()) {
    return 'Escribe por qué cambias el factor: la persona lo va a ver en su comprobante';
  }
  if (!Number.isFinite(edit.adjustment)) return 'El ajuste debe ser un número';
  if (edit.adjustment !== 0 && !edit.adjustment_reason?.trim()) {
    return 'Todo ajuste necesita un motivo';
  }
  return null;
};

/** Quincena calendario (1–15 o 16–fin de mes) que contiene la fecha. */
export const quincenaFor = (date: Date): { start: string; end: string; label: string } => {
  const y = date.getFullYear();
  const m = date.getMonth();
  const firstHalf = date.getDate() <= 15;
  const start = new Date(y, m, firstHalf ? 1 : 16);
  const end = firstHalf ? new Date(y, m, 15) : new Date(y, m + 1, 0);
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return {
    start: iso(start),
    end: iso(end),
    label: `Quincena ${String(start.getDate()).padStart(2, '0')}–${String(end.getDate()).padStart(2, '0')} ${months[m]}`,
  };
};

/** CSV para nómina: una fila por persona, separador ";" (Excel en español). */
export const tipAllocationsToCsv = (period: TipPeriod, allocations: TipAllocation[]): string => {
  const header = [
    'Persona', 'Cargo', 'Grupo', 'Días', 'Horas', 'Propina de sus mesas', 'Conserva de sus mesas',
    'Peso del cargo', 'Factor gerente', 'Motivo factor', 'Fondo común', 'Ajuste', 'Motivo ajuste', 'Total a pagar',
  ];
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = allocations.map(a => [
    a.staff_name, a.position, TIP_GROUP_LABEL[(a.tip_group || 'sala') as TipGroup], a.days_worked, a.hours_worked,
    Math.round(num(a.table_tips_generated)), Math.round(num(a.table_tips_kept)), a.role_weight, a.manager_factor,
    a.factor_reason, Math.round(num(a.shared_amount)), Math.round(num(a.adjustment)), a.adjustment_reason,
    Math.round(num(a.total_amount)),
  ]);
  return [
    `${period.label} (${period.start_date} a ${period.end_date})`,
    header.join(';'),
    ...rows.map(r => r.map(esc).join(';')),
  ].join('\n');
};
