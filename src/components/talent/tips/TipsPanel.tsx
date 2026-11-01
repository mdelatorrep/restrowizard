import { useState } from 'react';
import { CheckCircle2, Coins, Download, Loader2, Lock, Pencil, RefreshCw, Settings2, AlertTriangle, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/formatCurrency';
import { useTips } from '@/hooks/tips/useTips';
import { TIP_GROUP_LABEL, tipAllocationsToCsv, type TipAllocation, type TipGroup } from '@/hooks/tips/tipsData';
import { TipAllocationDialog } from './TipAllocationDialog';
import { TipSettingsDialog } from './TipSettingsDialog';

const money = (n: number) => formatCurrency(Math.round(Number(n) || 0), 'COP');

const GROUP_STYLE: Record<TipGroup, string> = {
  sala: 'bg-primary/10 text-primary',
  barra: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  cocina: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  apoyo: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
  gerencia: 'bg-muted text-muted-foreground',
  excluido: 'bg-muted text-muted-foreground',
};

/**
 * Liquidación quincenal de propinas.
 * El mesero conserva un % de sus mesas; el resto va a un fondo común que se
 * reparte por cargo × días trabajados × factor del gerente. Todo cuadra al peso
 * y nada se cierra si los ajustes no netean a cero.
 */
export const TipsPanel = () => {
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<TipAllocation | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const { periods, period, allocations, summary, settings, loading, error, compute, close, openPeriod, saveAllocation, saveSettings } =
    useTips(selectedId);

  const isClosed = period?.status === 'closed';
  const busy = compute.isPending || close.isPending || openPeriod.isPending;

  const fail = (title: string) => (e: unknown) =>
    toast({ title, description: e instanceof Error ? e.message : String(e), variant: 'destructive' });

  const handleCompute = () =>
    period && compute.mutate(period.id, {
      onSuccess: r => toast({
        title: 'Liquidación recalculada',
        description: r?.unassigned_pool > 0
          ? 'Hay fondo común sin repartir: nadie con días trabajados en el período tiene peso de cargo.'
          : `Se repartieron ${money(r?.total_tips || 0)} entre ${summary.people} personas.`,
      }),
      onError: fail('No se pudo calcular'),
    });

  const handleClose = () =>
    period && close.mutate(period.id, {
      onSuccess: () => toast({ title: 'Quincena cerrada', description: 'Ya no se puede modificar. Exporta el archivo para nómina.' }),
      onError: fail('No se pudo cerrar'),
      onSettled: () => setConfirmClose(false),
    });

  const handleOpenCurrent = () =>
    openPeriod.mutate(new Date(), {
      onSuccess: id => { setSelectedId(id); toast({ title: 'Quincena abierta', description: 'Calculada con las ventas y turnos registrados hasta hoy.' }); },
      onError: fail('No se pudo abrir la quincena'),
    });

  const handleExport = () => {
    if (!period) return;
    const blob = new Blob(['﻿' + tipAllocationsToCsv(period, allocations)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `propinas-${period.start_date}-${period.end_date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return (
      <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
        No pudimos cargar las propinas: {(error as Error).message}
      </CardContent></Card>
    );
  }

  if (!period) {
    return (
      <Card>
        <CardContent className="py-14 text-center space-y-4">
          <Coins className="h-10 w-10 mx-auto text-muted-foreground" />
          <div className="space-y-1">
            <p className="font-medium">Aún no has liquidado propinas aquí</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Abrimos la quincena actual con las propinas registradas en el POS y los días que cada persona trabajó según los turnos.
            </p>
          </div>
          <div className="flex justify-center gap-2">
            <Button onClick={handleOpenCurrent} disabled={busy}>
              {openPeriod.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Abrir quincena actual
            </Button>
            <Button variant="outline" onClick={() => setShowSettings(true)}><Settings2 className="h-4 w-4 mr-2" />Reglas de reparto</Button>
          </div>
        </CardContent>
        <TipSettingsDialog open={showSettings} onOpenChange={setShowSettings} settings={settings}
          saving={saveSettings.isPending}
          onSave={input => saveSettings.mutate(input, {
            onSuccess: () => { setShowSettings(false); toast({ title: 'Reglas guardadas' }); },
            onError: fail('No se pudieron guardar las reglas'),
          })} />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Selector y acciones */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Select value={period.id} onValueChange={setSelectedId}>
            <SelectTrigger className="w-[240px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {periods.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.label}{p.status === 'closed' ? ' · cerrada' : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isClosed
            ? <Badge variant="secondary" className="gap-1"><Lock className="h-3 w-3" />Cerrada</Badge>
            : <Badge className="gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/15">Por liquidar</Badge>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}><Settings2 className="h-4 w-4 mr-1.5" />Reglas</Button>
          <Button variant="outline" size="sm" onClick={handleOpenCurrent} disabled={busy}><Plus className="h-4 w-4 mr-1.5" />Quincena actual</Button>
          {!isClosed && (
            <Button variant="outline" size="sm" onClick={handleCompute} disabled={busy}>
              {compute.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
              Recalcular
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1.5" />Exportar para nómina</Button>
          {!isClosed && (
            <Button size="sm" onClick={() => setConfirmClose(true)} disabled={!summary.canClose || busy}>
              <CheckCircle2 className="h-4 w-4 mr-1.5" />Cerrar quincena
            </Button>
          )}
        </div>
      </div>

      {/* Cifras */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Kpi label="Propinas recaudadas" value={money(period.total_tips)} hint={`${period.orders_count} mesas con propina`} />
        <Kpi label="Se quedan los meseros" value={money(period.table_kept)}
          hint={`${settings?.policy?.table_share_pct ?? 70}% de sus propias mesas`} />
        <Kpi label="Fondo común" value={money(period.shared_pool)} hint="Se reparte por cargo y días" />
        <Kpi label="Cuadre" value={summary.isBalanced ? 'Exacto' : money(summary.difference)}
          hint={summary.isBalanced ? `${summary.people} personas · ajustes netos ${money(summary.adjustmentsNet)}` : 'Recalcula antes de cerrar'}
          tone={summary.isBalanced ? 'good' : 'bad'} />
      </div>

      {!isClosed && summary.blockers.length > 0 && period.computed_at && (
        <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
          <div>{summary.blockers.map(b => <p key={b}>{b}</p>)}</div>
        </div>
      )}

      {/* Reparto por grupo */}
      <div className="flex flex-wrap gap-2">
        {summary.byGroup.map(g => (
          <span key={g.group} className={`rounded-full px-3 py-1 text-xs font-medium ${GROUP_STYLE[g.group]}`}>
            {TIP_GROUP_LABEL[g.group]} · {g.people} · {money(g.amount)}
          </span>
        ))}
      </div>

      {/* Liquidación */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Liquidación por persona</CardTitle>
          <CardDescription>
            Días tomados de los turnos (sin ausencias). Toca una fila para ajustar el factor o registrar un ajuste con su motivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Persona</TableHead>
                <TableHead className="text-right">Días</TableHead>
                <TableHead className="text-right hidden md:table-cell">Sus mesas</TableHead>
                <TableHead className="text-right hidden md:table-cell">Conserva</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Peso × factor</TableHead>
                <TableHead className="text-right hidden md:table-cell">Fondo común</TableHead>
                <TableHead className="text-right">Ajuste</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocations.map(a => (
                <TableRow key={a.id} className={isClosed ? '' : 'cursor-pointer'} onClick={() => !isClosed && setEditing(a)}>
                  <TableCell>
                    <div className="font-medium">{a.staff_name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      {a.position}
                      <span className={`rounded px-1.5 py-0.5 text-[10px] ${GROUP_STYLE[(a.tip_group || 'sala') as TipGroup]}`}>
                        {TIP_GROUP_LABEL[(a.tip_group || 'sala') as TipGroup]}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{a.days_worked}</TableCell>
                  <TableCell className="text-right tabular-nums hidden md:table-cell">{a.table_tips_generated ? money(a.table_tips_generated) : '—'}</TableCell>
                  <TableCell className="text-right tabular-nums hidden md:table-cell">{a.table_tips_kept ? money(a.table_tips_kept) : '—'}</TableCell>
                  <TableCell className="text-right tabular-nums hidden lg:table-cell">
                    {a.role_weight}{Number(a.manager_factor) !== 1 && (
                      <span className="text-amber-600" title={a.factor_reason || ''}> × {a.manager_factor}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums hidden md:table-cell">{money(a.shared_amount)}</TableCell>
                  <TableCell className="text-right tabular-nums" title={a.adjustment_reason || ''}>
                    {Number(a.adjustment) !== 0
                      ? <span className={Number(a.adjustment) > 0 ? 'text-emerald-600' : 'text-red-600'}>{money(a.adjustment)}</span>
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{money(a.total_amount)}</TableCell>
                  <TableCell>{!isClosed && <Pencil className="h-3.5 w-3.5 text-muted-foreground" />}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TipAllocationDialog allocation={editing} onOpenChange={o => !o && setEditing(null)} saving={saveAllocation.isPending}
        onSave={edit => saveAllocation.mutate(edit, {
          onSuccess: () => { setEditing(null); toast({ title: 'Guardado y recalculado', description: 'El fondo común se redistribuyó con el nuevo factor.' }); },
          onError: fail('No se pudo guardar'),
        })} />

      <TipSettingsDialog open={showSettings} onOpenChange={setShowSettings} settings={settings} saving={saveSettings.isPending}
        onSave={input => saveSettings.mutate(input, {
          onSuccess: () => {
            setShowSettings(false);
            toast({ title: 'Reglas guardadas', description: isClosed ? 'Aplican a las quincenas abiertas.' : 'Recalcula la quincena para aplicarlas.' });
          },
          onError: fail('No se pudieron guardar las reglas'),
        })} />

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar {period.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se pagarán {money(summary.totalPaid)} a {summary.people} personas. Después de cerrar no se puede modificar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClose} disabled={close.isPending}>Cerrar quincena</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const Kpi = ({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'good' | 'bad' }) => (
  <Card>
    <CardContent className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${tone === 'good' ? 'text-emerald-600' : tone === 'bad' ? 'text-red-600' : ''}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </CardContent>
  </Card>
);
