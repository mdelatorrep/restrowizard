import React, { useMemo, useState } from 'react';
import { Landmark, Settings2, RefreshCw } from 'lucide-react';
import { Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  CASH_FLOW_INFLOW_KINDS, CASH_FLOW_KIND_LABEL, CASH_FLOW_OUTFLOW_KINDS, cashFlowHeadline,
} from '@/hooks/finance/financeIntegral';
import { useCashFlow } from '@/hooks/finance/useFinanceIntegral';
import { AccountsDialog, FinanceSettingsDialog } from './FinanceSetupDialogs';
import { Banner, MoneyKpi, fmtDay, money } from './FinanceUi';
import { cn } from '@/lib/utils';

const millions = (v: number) => `${(v / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 0 })}M`;

export const CashFlowPanel: React.FC = () => {
  const { cashFlow, loading, error, refetch } = useCashFlow(13);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const chart = useMemo(() => (cashFlow?.weeks || []).map(w => ({
    week: fmtDay(w.week_start), entradas: w.inflows, salidas: -w.outflows, saldo: w.closing,
  })), [cashFlow]);

  if (loading) return <p className="p-6 text-sm text-muted-foreground">Calculando el flujo de caja…</p>;
  if (error || !cashFlow) {
    return <Banner tone="risk">No se pudo calcular el flujo de caja: {error?.message || 'sin datos'}.</Banner>;
  }

  const headline = cashFlowHeadline(cashFlow);
  const last = cashFlow.weeks[cashFlow.weeks.length - 1];
  const a = cashFlow.assumptions;
  const kindsIn = CASH_FLOW_INFLOW_KINDS.filter(k => cashFlow.weeks.some(w => w.by_kind[k]));
  const kindsOut = CASH_FLOW_OUTFLOW_KINDS.filter(k => cashFlow.weeks.some(w => w.by_kind[k]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Banner tone={headline.tone}>{headline.text}</Banner>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAccountsOpen(true)}><Landmark className="mr-2 h-4 w-4" />Saldos</Button>
          <Button variant="outline" onClick={() => setSettingsOpen(true)}><Settings2 className="mr-2 h-4 w-4" />Supuestos</Button>
          <Button variant="ghost" size="icon" aria-label="Recalcular" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MoneyKpi label="Saldo hoy" value={money(cashFlow.opening_balance)}
          hint={cashFlow.balance_as_of ? `Cuentas al ${fmtDay(cashFlow.balance_as_of)}` : 'Sin cuentas registradas'} />
        <MoneyKpi label="Punto más bajo" value={money(cashFlow.lowest?.closing)}
          hint={cashFlow.lowest ? `Semana del ${fmtDay(cashFlow.lowest.week_start)}` : undefined}
          tone={(cashFlow.lowest?.closing ?? 0) < 0 ? 'bad' : (cashFlow.lowest?.closing ?? 0) < cashFlow.min_cash_buffer ? 'warn' : 'good'} />
        <MoneyKpi label="Saldo en 13 semanas" value={money(last?.closing)} hint={`Al ${fmtDay(cashFlow.horizon_end)}`} />
        <MoneyKpi label="Venta semanal proyectada" value={money(a.weekly_sales_projected)} hint="Promedio 8 semanas × calendario de eventos" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Próximas 13 semanas</CardTitle>
          <CardDescription>Barras: lo que entra y lo que sale cada semana. Línea: saldo al cierre de la semana.</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chart} margin={{ top: 8, right: 8, left: 8, bottom: 0 }} stackOffset="sign">
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={millions} tick={{ fontSize: 11 }} width={48} />
              <Tooltip formatter={(v: number, n: string) => [money(Math.abs(v)), n]} />
              <ReferenceLine y={0} className="stroke-muted-foreground" />
              {cashFlow.min_cash_buffer > 0 && <ReferenceLine y={cashFlow.min_cash_buffer} strokeDasharray="4 4" stroke="#d97706" />}
              <Bar dataKey="entradas" name="Entradas" stackId="f" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="salidas" name="Salidas" stackId="f" fill="#f87171" radius={[0, 0, 3, 3]} />
              <Line dataKey="saldo" name="Saldo" type="monotone" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalle semanal</CardTitle>
          <CardDescription>El formato de 13 semanas que usan los bancos y los inversionistas.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-10 min-w-48 bg-card">Concepto</TableHead>
                  {cashFlow.weeks.map(w => <TableHead key={w.week_start} className="whitespace-nowrap text-right">{fmtDay(w.week_start)}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-muted/40">
                  <TableCell className="sticky left-0 bg-muted/40 font-medium">Saldo inicial</TableCell>
                  {cashFlow.weeks.map(w => <TableCell key={w.week_start} className="text-right tabular-nums">{millions(w.opening)}</TableCell>)}
                </TableRow>
                {kindsIn.map(k => (
                  <TableRow key={k}>
                    <TableCell className="sticky left-0 bg-card text-emerald-700 dark:text-emerald-400">+ {CASH_FLOW_KIND_LABEL[k]}</TableCell>
                    {cashFlow.weeks.map(w => <TableCell key={w.week_start} className="text-right tabular-nums">{w.by_kind[k] ? millions(w.by_kind[k]) : '—'}</TableCell>)}
                  </TableRow>
                ))}
                {kindsOut.map(k => (
                  <TableRow key={k}>
                    <TableCell className="sticky left-0 bg-card text-red-700 dark:text-red-400">− {CASH_FLOW_KIND_LABEL[k]}</TableCell>
                    {cashFlow.weeks.map(w => <TableCell key={w.week_start} className="text-right tabular-nums">{w.by_kind[k] ? millions(-w.by_kind[k]) : '—'}</TableCell>)}
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="sticky left-0 bg-card font-medium">Neto de la semana</TableCell>
                  {cashFlow.weeks.map(w => (
                    <TableCell key={w.week_start} className={cn('text-right font-medium tabular-nums', w.net < 0 && 'text-red-600')}>{millions(w.net)}</TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-muted/40">
                  <TableCell className="sticky left-0 bg-muted/40 font-semibold">Saldo final</TableCell>
                  {cashFlow.weeks.map(w => (
                    <TableCell key={w.week_start} className={cn('text-right font-semibold tabular-nums', w.closing < 0 ? 'text-red-600' : w.closing < cashFlow.min_cash_buffer && 'text-amber-600')}>
                      {millions(w.closing)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pagos de las próximas 2 semanas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {cashFlow.upcoming.length === 0 ? <p className="text-sm text-muted-foreground">Sin pagos programados.</p> : cashFlow.upcoming.map((u, i) => (
              <div key={i} className="flex items-center justify-between gap-3 border-b pb-2 text-sm last:border-0">
                <div className="min-w-0">
                  <p className="truncate font-medium">{u.label}</p>
                  <p className="text-xs text-muted-foreground">{fmtDay(u.day)} · {CASH_FLOW_KIND_LABEL[u.kind]}</p>
                </div>
                <span className="shrink-0 tabular-nums">{money(u.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cómo se calcula</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Venta futura: promedio del mismo día de la semana en las últimas {a.history_weeks} semanas, ajustado por los partidos y festivos del calendario.</p>
            <p>Datáfono: llega a {a.card_settlement_days} día(s) menos {a.card_fee_pct}% de comisión y {a.card_withholding_pct}% de retenciones. Rappi: a {a.rappi_settlement_days} días menos {a.rappi_commission_pct}%.</p>
            <p>Compras de insumos: {a.food_cost_pct}% de la venta neta (costo real de los últimos 30 días), pagadas a {a.supplier_payment_days} días. Las facturas ya recibidas van por su vencimiento.</p>
            <p>Nómina y propinas de datáfono se pagan el 15 y el último día del mes. Impoconsumo ({a.tax_rate_pct}%) se paga por bimestre.</p>
          </CardContent>
        </Card>
      </div>

      <AccountsDialog open={accountsOpen} onOpenChange={setAccountsOpen} />
      <FinanceSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default CashFlowPanel;
