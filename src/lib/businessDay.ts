/**
 * Día operativo del restaurante.
 *
 * Un bar que cierra a las 2 a. m. vende el sábado hasta el domingo de madrugada:
 * esa venta es del sábado. Y en Colombia (UTC−5, sin horario de verano) el día
 * UTC cambia a las 7 p. m., en plena hora pico. Antes cada pantalla definía "hoy"
 * y "7 días" a su manera (día UTC, ventana móvil de 24 h, redondeo a medianoche
 * UTC que sumaba un día de más) y Dashboard, Reportes, Pedidos y Finanzas daban
 * cifras distintas para el mismo período.
 *
 * Regla única, igual a la de la base de datos (seed y RPCs):
 *   día operativo = fecha local de Bogotá de (instante − 6 h).
 * Un período de días operativos [desde, hasta] se consulta como
 *   created_at >= inicio(desde)  AND  created_at < inicio(hasta + 1).
 */
export const BUSINESS_UTC_OFFSET_HOURS = -5;
export const BUSINESS_DAY_CUTOFF_HOUR = 6;

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
/** Instante UTC → "reloj del día operativo": hora local menos la hora de corte. */
const SHIFT_MS = (BUSINESS_UTC_OFFSET_HOURS - BUSINESS_DAY_CUTOFF_HOUR) * HOUR_MS;

const toMs = (ts: string | number | Date): number =>
  ts instanceof Date ? ts.getTime() : typeof ts === 'number' ? ts : Date.parse(ts);

/** Día operativo ('yyyy-MM-dd') al que pertenece un instante. */
export const businessDayOf = (ts: string | number | Date): string =>
  new Date(toMs(ts) + SHIFT_MS).toISOString().slice(0, 10);

/** Día operativo en curso. */
export const todayBusinessDay = (now: Date = new Date()): string => businessDayOf(now);

/** Suma (o resta) días a un día operativo 'yyyy-MM-dd'. */
export const addBusinessDays = (day: string, n: number): string =>
  new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);

/** Instante (ISO UTC) en que empieza un día operativo: 6:00 a. m. hora de Bogotá. */
export const businessDayStartIso = (day: string): string =>
  new Date(Date.parse(`${day}T00:00:00Z`) - SHIFT_MS).toISOString();

/** Ventana para consultar [desde, hasta] (ambos inclusive) con gte/lt. */
export const businessRangeIso = (fromDay: string, toDay: string) => ({
  from: businessDayStartIso(fromDay),
  toExclusive: businessDayStartIso(addBusinessDays(toDay, 1)),
});

/** Milisegundos transcurridos desde que abrió el día operativo del instante. */
export const elapsedInBusinessDay = (ts: string | number | Date): number => {
  const ms = toMs(ts);
  return ms - Date.parse(businessDayStartIso(businessDayOf(ms)));
};

/** Fecha de calendario local ('yyyy-MM-dd') de un Date construido en la zona del navegador. */
export const localCalendarDay = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
