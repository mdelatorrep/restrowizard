/**
 * TK-2 · Fuente única para el cálculo de costo laboral de un turno.
 * Usada tanto por el módulo de Turnos como por Finanzas/P&L para
 * garantizar que el mismo turno produzca el mismo costo en ambos.
 *
 * Fórmula:
 *   horas_netas = (fin - inicio) - break_minutes/60
 *   costo       = horas_netas * hourly_rate
 *
 * Prioridad: actual_start_time/actual_end_time si existen, si no
 * start_time/end_time programados. Tasa: hourly_rate_override > base.
 */

export interface ShiftLike {
  start_time?: string | null;
  end_time?: string | null;
  actual_start_time?: string | null;
  actual_end_time?: string | null;
  break_minutes?: number | null;
  hourly_rate_override?: number | null;
}

const parseHms = (t: string): number => {
  const [h = 0, m = 0, s = 0] = String(t).split(':').map(Number);
  return (h || 0) * 60 + (m || 0) + (s || 0) / 60; // minutes
};

export const calcShiftHours = (shift: ShiftLike): number => {
  const start = shift.actual_start_time || shift.start_time;
  const end = shift.actual_end_time || shift.end_time;
  if (!start || !end) return 0;
  const minutes = parseHms(end) - parseHms(start) - (Number(shift.break_minutes) || 0);
  return Math.max(0, minutes / 60);
};

export const calcShiftLaborCost = (
  shift: ShiftLike,
  baseHourlyRate?: number | null
): number => {
  const hours = calcShiftHours(shift);
  const rate = Number(shift.hourly_rate_override) || Number(baseHourlyRate) || 0;
  return hours * rate;
};
