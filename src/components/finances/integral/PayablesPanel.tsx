import React, { useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AGING_LABEL, type AgingBucket, type Payable } from '@/hooks/finance/financeIntegral';
import { useCashFlow, useFinanceAccounts, usePayables } from '@/hooks/finance/useFinanceIntegral';
import { PayDialog } from './PayDialog';
import { Banner, MoneyKpi, fmtDay, money, relativeDays } from './FinanceUi';
import { cn } from '@/lib/utils';

const FILTERS: (AgingBucket | 'all')[] = ['all', 'overdue', 'week', 'fortnight', 'month', 'later'];

export const PayablesPanel: React.FC = () => {
  const { payables, aging, loading, markPaid } = usePayables();
  const { accounts, total: cashTotal } = useFinanceAccounts();
  // El saldo de hoy solo no basta: durante la semana entran datáfono, contado y
  // Rappi. Se usa la misma proyección del flujo de caja para no contradecirlo.
  const { cashFlow } = useCashFlow(13);
  const week0 = cashFlow?.weeks?.[0];
  const [filter, setFilter] = useState<AgingBucket | 'all'>('all');
  const [paying, setPaying] = useState<Payable | null>(null);

  const visible = useMemo(() => (filter === 'all' ? payables : payables.filter(p => p.bucket === filter)), [payables, filter]);
  const dueSoon = aging.totals.overdue + aging.totals.week;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MoneyKpi label="Total por pagar" value={money(aging.total)} hint={`${aging.count} obligaciones`} />
        <MoneyKpi label="Vencido" value={money(aging.totals.overdue)} tone={aging.totals.overdue > 0 ? 'bad' : 'good'} />
        <MoneyKpi label="Próximos 7 días" value={money(aging.totals.week)} tone={aging.totals.week > 0 ? 'warn' : 'default'} />
        <MoneyKpi label="8 a 15 días" value={money(aging.totals.fortnight)} />
        <MoneyKpi label="16 días o más" value={money(aging.totals.month + aging.totals.later)} />
      </div>

      {accounts.length === 0 ? (
        <Banner tone="warn">Registra el saldo de tus cuentas en <strong>Flujo de caja</strong> para saber si alcanzas a pagar lo de esta semana.</Banner>
      ) : week0 ? (
        <Banner tone={week0.closing < 0 ? 'risk' : week0.closing < (cashFlow?.min_cash_buffer || 0) ? 'warn' : 'ok'}>
          Debes <strong>{money(dueSoon)}</strong> entre lo vencido y los próximos 7 días. Con <strong>{money(cashTotal)}</strong> en cuentas
          y <strong>{money(week0.inflows)}</strong> que entran esta semana (proyección), cierras la semana con <strong>{money(week0.closing)}</strong>.
          {week0.closing < 0 && ' No alcanza: prioriza a los proveedores de los que depende la operación y negocia plazo con el resto.'}
          {week0.closing >= 0 && week0.closing < (cashFlow?.min_cash_buffer || 0) && ' Alcanza, pero quedas por debajo de tu colchón mínimo.'}
        </Banner>
      ) : (
        <Banner tone={cashTotal >= dueSoon ? 'ok' : 'warn'}>
          Tienes <strong>{money(cashTotal)}</strong> en cuentas y debes <strong>{money(dueSoon)}</strong> entre lo vencido y los próximos 7 días.
        </Banner>
      )}

      <Card>
        <CardHeader className="gap-3">
          <div>
            <CardTitle className="text-base">Agenda de pagos</CardTitle>
            <CardDescription>Facturas de proveedores sin pagar y gastos pendientes, por fecha de vencimiento.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(f => (
              <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}>
                {f === 'all' ? 'Todo' : AGING_LABEL[f]}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-sm text-muted-foreground">Cargando…</p>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              <p className="font-medium">Nada pendiente aquí</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vence</TableHead>
                    <TableHead>A quién</TableHead>
                    <TableHead className="hidden md:table-cell">Detalle</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map(p => (
                    <TableRow key={p.key}>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm">{fmtDay(p.due_date)}</div>
                        <div className={cn('text-xs', p.bucket === 'overdue' ? 'font-medium text-red-600' : 'text-muted-foreground')}>
                          {relativeDays(p.days_to_due)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium leading-tight">{p.label}</div>
                        <Badge variant="outline" className="mt-1 text-[10px]">{p.source === 'invoice' ? 'Proveedor' : 'Gasto'}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{p.detail}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{money(p.amount)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => setPaying(p)}>Pagar</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PayDialog
        open={!!paying}
        onOpenChange={o => !o && setPaying(null)}
        title={paying ? `${paying.label} · ${paying.detail}` : ''}
        amount={paying?.amount || 0}
        accounts={accounts}
        saving={markPaid.isPending}
        onConfirm={async p => { if (paying) await markPaid.mutateAsync({ source: paying.source, id: paying.id, ...p }); setPaying(null); }}
      />
    </div>
  );
};

export default PayablesPanel;
