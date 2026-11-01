import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatCurrency';

export const money = (v: number | null | undefined) => formatCurrency(Math.round(Number(v) || 0), 'COP');

/** "15 nov" a partir de 'yyyy-MM-dd', sin correrse de día por zona horaria. */
export const fmtDay = (d: string | null | undefined, withYear = false) =>
  d ? new Date(`${d}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) }) : '—';

export const relativeDays = (days: number | null) => {
  if (days === null) return '';
  if (days === 0) return 'hoy';
  if (days === 1) return 'mañana';
  if (days === -1) return 'ayer';
  return days > 0 ? `en ${days} días` : `hace ${-days} días`;
};

type Tone = 'default' | 'good' | 'warn' | 'bad';

const TONE_CLASS: Record<Tone, string> = {
  default: '',
  good: 'text-emerald-600 dark:text-emerald-400',
  warn: 'text-amber-600 dark:text-amber-400',
  bad: 'text-red-600 dark:text-red-400',
};

export const MoneyKpi: React.FC<{ label: string; value: string; hint?: string; tone?: Tone; className?: string }> = ({
  label, value, hint, tone = 'default', className,
}) => (
  <Card className={cn('border-0 bg-gradient-to-br from-card to-muted/30', className)}>
    <CardContent className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-lg md:text-xl font-bold tabular-nums leading-tight break-words', TONE_CLASS[tone])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </CardContent>
  </Card>
);

export const Banner: React.FC<{ tone: 'ok' | 'warn' | 'risk'; children: React.ReactNode }> = ({ tone, children }) => (
  <div
    className={cn(
      'rounded-xl border px-4 py-3 text-sm',
      tone === 'ok' && 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100',
      tone === 'warn' && 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100',
      tone === 'risk' && 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100',
    )}
  >
    {children}
  </div>
);

/** Número en input sin separadores → number. Acepta "1.200.000" o "1200000". */
export const parseMoneyInput = (v: string) => Number(String(v).replace(/[^\d]/g, '')) || 0;
