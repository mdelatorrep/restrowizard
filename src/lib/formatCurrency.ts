/**
 * Formateador único de moneda.
 *
 * Pensado para COP por defecto (separador de miles `.`, sin decimales), pero
 * parametrizable por país/locale para escalar a otros mercados LATAM.
 *
 * Uso:
 *   formatCurrency(18000)             -> "$18.000"
 *   formatCurrency(18000, 'COP')      -> "$18.000"
 *   formatCurrency(12000, 'COP', { suffix: '/hr' }) -> "$12.000/hr"
 *   formatCurrency(12.5, 'USD')       -> "$12.50"
 */

export type CurrencyCode = 'COP' | 'USD' | 'MXN' | 'PEN' | 'CLP' | 'ARS' | 'EUR';

const LOCALE_BY_CURRENCY: Record<CurrencyCode, string> = {
  COP: 'es-CO',
  USD: 'en-US',
  MXN: 'es-MX',
  PEN: 'es-PE',
  CLP: 'es-CL',
  ARS: 'es-AR',
  EUR: 'es-ES',
};

const DEFAULT_DIGITS: Record<CurrencyCode, number> = {
  COP: 0,
  CLP: 0,
  ARS: 0,
  USD: 2,
  MXN: 2,
  PEN: 2,
  EUR: 2,
};

interface Options {
  /** Forzar dígitos decimales. */
  decimals?: number;
  /** Sufijo a anexar (ej. "/hr"). */
  suffix?: string;
  /** Si el valor es 0/null/undefined/NaN, qué mostrar. */
  fallback?: string;
}

export const formatCurrency = (
  value: number | null | undefined,
  currency: CurrencyCode = 'COP',
  opts: Options = {},
): string => {
  const { decimals, suffix, fallback } = opts;
  const n = typeof value === 'number' && Number.isFinite(value) ? value : NaN;

  if (!Number.isFinite(n)) {
    return fallback ?? '$0';
  }

  const digits = decimals ?? DEFAULT_DIGITS[currency] ?? 0;
  const locale = LOCALE_BY_CURRENCY[currency] ?? 'es-CO';

  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    // Forzamos símbolo corto para evitar "COP" antepuesto en algunos navegadores
    currencyDisplay: 'symbol',
  }).format(n);

  return suffix ? `${formatted}${suffix}` : formatted;
};

/** Alias breve para reportes / KPIs. */
export const fmt = formatCurrency;
