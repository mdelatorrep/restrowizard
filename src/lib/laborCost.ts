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
  // B-46: un turno que cruza la medianoche (18:00 → 02:00) termina "antes" de
  // empezar. Sin esto la resta da negativo y el turno costaba $0 en el P&L.
  let span = parseHms(end) - parseHms(start);
  if (span <= 0) span += 24 * 60;
  const minutes = span - (Number(shift.break_minutes) || 0);
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

/**
 * Horas ya trabajadas de un turno a un instante dado (para el día en curso).
 * El flash del día comparaba la nómina COMPLETA del día contra las ventas de
 * medio día y mostraba costo laboral de 140 %. Un turno programado de 18:00 a
 * 02:00 a las 8 p. m. lleva 2 h devengadas, no 8. Las horas del turno se toman
 * en hora de Bogotá; un inicio antes de las 6 a. m. es la madrugada del día
 * siguiente (mismo día operativo).
 */
export const calcShiftHoursElapsed = (shift: ShiftLike & { shift_date: string }, nowMs: number): number => {
  const start = shift.actual_start_time || shift.start_time;
  if (!start) return 0;
  const totalHours = calcShiftHours(shift);
  if (totalHours <= 0) return 0;
  const startMin = parseHms(start);
  const dayOffset = startMin < 6 * 60 ? 1 : 0;
  const startMs = Date.parse(`${shift.shift_date}T00:00:00Z`) + dayOffset * 86_400_000 + (startMin + 5 * 60) * 60_000;
  const breakH = (Number(shift.break_minutes) || 0) / 60;
  const grossSpanH = totalHours + breakH;
  const elapsedH = Math.min(Math.max((nowMs - startMs) / 3_600_000, 0), grossSpanH);
  // El descanso se prorratea a lo largo del turno.
  return grossSpanH > 0 ? elapsedH * (totalHours / grossSpanH) : 0;
};

export const calcShiftLaborCostElapsed = (
  shift: ShiftLike & { shift_date: string },
  baseHourlyRate: number | null | undefined,
  nowMs: number,
): number => {
  const rate = Number(shift.hourly_rate_override) || Number(baseHourlyRate) || 0;
  return calcShiftHoursElapsed(shift, nowMs) * rate;
};
