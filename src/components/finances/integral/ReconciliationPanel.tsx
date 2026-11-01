import React, { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CHANNEL_LABEL, SETTLEMENT_STATE_LABEL, type SettlementChannel } from '@/hooks/finance/financeIntegral';
import { useReconciliation } from '@/hooks/finance/useFinanceIntegral';
import { addBusinessDays, todayBusinessDay } from '@/lib/businessDay';
import { Banner, MoneyKpi, fmtDay, money, parseMoneyInput } from './FinanceUi';
import { cn } from '@/lib/utils';

const RANGES = [30, 60, 90];

const SettlementDialog: React.FC<{
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (s: { channel: SettlementChannel; period_start: string; period_end: string; net_deposited: number;
    fees_reported: number; withholdings_reported: number; deposit_date: string; reference: string }) => Promise<unknown>;
  saving?: boolean;
}> = ({ open, onOpenChange, onSave, saving }) => {
  const today = todayBusinessDay();
  const [channel, setChannel] = useState<SettlementChannel>('card');
  const [from, setFrom] = useState(addBusinessDays(today, -7));
  const [to, setTo] = useState(addBusinessDays(today, -1));
  const [net, setNet] = useState('');
  const [fees, setFees] = useState('');
  const [wh, setWh] = useState('');
  const [depositDate, setDepositDate] = useState(today);
  const [reference, setReference] = useState('');
  const valid = parseMoneyInput(net) > 0 && from <= to;
  const fmt = (v: string) => (v ? Number(parseMoneyInput(v)).toLocaleString('es-CO') : '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar liquidación</DialogTitle>
          <DialogDescription>Lo que de verdad llegó al banco, según el extracto o el reporte del datáfono / Rappi.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Medio</Label>
            <Select value={channel} onValueChange={v => setChannel(v as SettlementChannel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(Object.keys(CHANNEL_LABEL) as SettlementChannel[]).map(c => <SelectItem key={c} value={c}>{CHANNEL_LABEL[c]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label htmlFor="st-from">Ventas desde</Label><Input id="st-from" type="date" value={from} onChange={e => setFrom(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label htmlFor="st-to">Ventas hasta</Label><Input id="st-to" type="date" value={to} onChange={e => setTo(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label htmlFor="st-net">Neto depositado</Label><Input id="st-net" inputMode="numeric" value={fmt(net)} onChange={e => setNet(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label htmlFor="st-date">Fecha del depósito</Label><Input id="st-date" type="date" value={depositDate} onChange={e => setDepositDate(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label htmlFor="st-fees">Comisión cobrada (opcional)</Label><Input id="st-fees" inputMode="numeric" value={fmt(fees)} onChange={e => setFees(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label htmlFor="st-wh">Retenciones (opcional)</Label><Input id="st-wh" inputMode="numeric" value={fmt(wh)} onChange={e => setWh(e.target.value)} /></div>
          </div>
          <div className="grid gap-1.5"><Label htmlFor="st-ref">Referencia</Label><Input id="st-ref" value={reference} onChange={e => setReference(e.target.value)} placeholder="N.º de liquidación o consignación" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={!valid || saving} onClick={async () => {
            await onSave({ channel, period_start: from, period_end: to, net_deposited: parseMoneyInput(net),
              fees_reported: parseMoneyInput(fees), withholdings_reported: parseMoneyInput(wh), deposit_date: depositDate, reference });
            onOpenChange(false); setNet(''); setFees(''); setWh(''); setReference('');
          }}>{saving ? 'Guardando…' : 'Guardar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const ReconciliationPanel: React.FC = () => {
  const [days, setDays] = useState(30);
  const to = addBusinessDays(todayBusinessDay(), -1);
  const from = addBusinessDays(to, -(days - 1));
  const { reconciliation: r, loading, error, addSettlement, removeSettlement } = useReconciliation(from, to);
  const [open, setOpen] = useState(false);

  const totals = useMemo(() => {
    if (!r) return null;
    const short = r.settlements.filter(s => s.state === 'short').reduce((sum, s) => sum + s.difference, 0);
    const unreported = r.channels.filter(c => c.channel !== 'digital').reduce((sum, c) => sum + c.unreported_net, 0);
    return { short, unreported };
  }, [r]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {RANGES.map(d => <Button key={d} size="sm" variant={days === d ? 'default' : 'outline'} onClick={() => setDays(d)}>Últimos {d} días</Button>)}
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Registrar liquidación</Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Conciliando…</p>}
      {error && <Banner tone="risk">No se pudo conciliar: {error.message}</Banner>}

      {r && totals && (
        <>
          {totals.short < 0 ? (
            <Banner tone="risk">
              Te depositaron <strong>{money(-totals.short)}</strong> menos de lo que dice el POS en {r.settlements.filter(s => s.state === 'short').length} liquidación(es).
              Reclama con el soporte de la liquidación y el detalle de ventas de esos días.
            </Banner>
          ) : (
            <Banner tone="ok">Las liquidaciones registradas cuadran con las ventas del POS.</Banner>
          )}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {r.channels.map(c => (
              <Card key={c.channel}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{CHANNEL_LABEL[c.channel]}</CardTitle>
                  <CardDescription className="text-xs">Esperado neto según POS: {money(c.expected_net)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Reportado</span><span className="tabular-nums">{money(c.reported_net)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Diferencia</span>
                    <span className={cn('tabular-nums font-medium', c.difference < -2000 && 'text-red-600', c.difference > 2000 && 'text-amber-600')}>{money(c.difference)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Sin liquidación</span>
                    <span className="tabular-nums">{c.unreported_days > 0 ? `${money(c.unreported_net)} · ${c.unreported_days} d` : '—'}</span></div>
                  {c.channel === 'digital' && c.unreported_days > 0 && (
                    <p className="pt-1 text-xs text-muted-foreground">Nequi y QR llegan al instante: concilia contra el extracto si quieres registrarlos.</p>
                  )}
                </CardContent>
              </Card>
            ))}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Efectivo (cierres de caja)</CardTitle>
                <CardDescription className="text-xs">{r.cash.sessions} cajas cerradas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Esperado</span><span className="tabular-nums">{money(r.cash.expected)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Contado</span><span className="tabular-nums">{money(r.cash.counted)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Descuadre</span>
                  <span className={cn('tabular-nums font-medium', r.cash.difference < 0 && 'text-red-600')}>{money(r.cash.difference)}</span></div>
                <p className="pt-1 text-xs text-muted-foreground">{r.cash.sessions_with_difference} cajas con descuadre de $1.000 o más.</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <MoneyKpi label="Faltantes en liquidaciones" value={money(-totals.short)} tone={totals.short < 0 ? 'bad' : 'good'} />
            <MoneyKpi label="Ventas sin liquidación registrada" value={money(totals.unreported)} hint="Datáfono y Rappi" tone={totals.unreported > 0 ? 'warn' : 'good'} />
            <MoneyKpi label="Descuadre de caja" value={money(r.cash.difference)} tone={r.cash.difference < 0 ? 'bad' : 'good'} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Liquidaciones</CardTitle>
              <CardDescription>
                Esperado = ventas del POS del período − comisión ({r.settings.card_fee_pct}% datáfono, {r.settings.rappi_commission_pct}% Rappi) − retenciones ({r.settings.card_withholding_pct}%). Cuadra si la diferencia es menor a $2.000 o 0,5 %.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {r.settlements.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">Aún no hay liquidaciones en este período. Registra la del datáfono de la semana pasada para empezar.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medio</TableHead>
                        <TableHead>Ventas del</TableHead>
                        <TableHead className="text-right">Depositado</TableHead>
                        <TableHead className="text-right">Esperado</TableHead>
                        <TableHead className="text-right">Diferencia</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {r.settlements.map(s => (
                        <TableRow key={s.id}>
                          <TableCell className="text-sm">{CHANNEL_LABEL[s.channel]}<div className="text-xs text-muted-foreground">{s.reference}</div></TableCell>
                          <TableCell className="whitespace-nowrap text-sm">{fmtDay(s.period_start)} – {fmtDay(s.period_end)}</TableCell>
                          <TableCell className="text-right tabular-nums">{money(s.net_deposited)}</TableCell>
                          <TableCell className="text-right tabular-nums">{money(s.expected_net)}</TableCell>
                          <TableCell className={cn('text-right tabular-nums font-medium', s.state === 'short' && 'text-red-600', s.state === 'over' && 'text-amber-600')}>{money(s.difference)}</TableCell>
                          <TableCell>
                            <Badge variant={s.state === 'ok' ? 'secondary' : 'destructive'} className={s.state === 'over' ? 'bg-amber-500' : ''}>{SETTLEMENT_STATE_LABEL[s.state]}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="icon" variant="ghost" aria-label="Eliminar liquidación" onClick={() => removeSettlement.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {r.cash_sessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cajas con descuadre</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Día</TableHead>
                      <TableHead>Cajero</TableHead>
                      <TableHead className="text-right">Esperado</TableHead>
                      <TableHead className="text-right">Contado</TableHead>
                      <TableHead className="text-right">Diferencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {r.cash_sessions.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="text-sm">{fmtDay(c.day)}</TableCell>
                        <TableCell className="text-sm">{c.cashier}</TableCell>
                        <TableCell className="text-right tabular-nums">{money(c.expected)}</TableCell>
                        <TableCell className="text-right tabular-nums">{money(c.counted)}</TableCell>
                        <TableCell className={cn('text-right tabular-nums font-medium', c.difference < 0 && 'text-red-600')}>{money(c.difference)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <SettlementDialog open={open} onOpenChange={setOpen} saving={addSettlement.isPending} onSave={s => addSettlement.mutateAsync(s)} />
    </div>
  );
};

export default ReconciliationPanel;
