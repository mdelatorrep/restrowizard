import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Pencil, Ban, Repeat, Receipt } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EXPENSE_CATEGORY_LABEL } from '@/hooks/finance/expenseAllocation';
import { summarizeExpenses, type Expense } from '@/hooks/finance/financeIntegral';
import { useExpenses, useFinanceAccounts, usePayables } from '@/hooks/finance/useFinanceIntegral';
import { todayBusinessDay } from '@/lib/businessDay';
import { ExpenseDialog } from './ExpenseDialog';
import { PayDialog } from './PayDialog';
import { MoneyKpi, fmtDay, money } from './FinanceUi';

const shiftMonth = (month: string, n: number) => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
};
const monthLabel = (month: string) =>
  new Date(`${month}-15T12:00:00`).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

export const ExpensesPanel: React.FC = () => {
  const [month, setMonth] = useState(todayBusinessDay().slice(0, 7));
  const { expenses, loading, save, cancel } = useExpenses(month);
  const { accounts } = useFinanceAccounts();
  const { markPaid } = usePayables();
  const [editing, setEditing] = useState<Expense | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paying, setPaying] = useState<Expense | null>(null);

  const summary = useMemo(() => summarizeExpenses(expenses), [expenses]);
  const byCategory = useMemo(() => {
    const m: Record<string, number> = {};
    expenses.filter(e => e.status !== 'cancelled').forEach(e => { m[e.category] = (m[e.category] || 0) + e.amount; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [expenses]);
  const today = todayBusinessDay();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setMonth(m => shiftMonth(m, -1))} aria-label="Mes anterior"><ChevronLeft className="h-4 w-4" /></Button>
          <span className="min-w-40 text-center font-semibold capitalize">{monthLabel(month)}</span>
          <Button variant="outline" size="icon" onClick={() => setMonth(m => shiftMonth(m, 1))} aria-label="Mes siguiente"><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />Registrar gasto</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MoneyKpi label="Gastos del mes" value={money(summary.total)} hint={`${expenses.filter(e => e.status !== 'cancelled').length} registros`} />
        <MoneyKpi label="Fijos" value={money(summary.fixed)} hint="Se prorratean en el P&L" />
        <MoneyKpi label="Variables" value={money(summary.variable)} />
        <MoneyKpi label="Por pagar" value={money(summary.pending)} tone={summary.pending > 0 ? 'warn' : 'good'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Movimientos</CardTitle>
            <CardDescription>Lo que no registres aquí no existe para el P&L: la utilidad sale inflada.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <p className="p-6 text-sm text-muted-foreground">Cargando…</p>
            ) : expenses.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-10 text-center">
                <Receipt className="h-8 w-8 text-muted-foreground" />
                <p className="font-medium">Sin gastos en {monthLabel(month)}</p>
                <p className="max-w-sm text-sm text-muted-foreground">Empieza por los fijos: arriendo, servicios, seguridad social. Márcalos como mensuales y se repiten solos.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead className="hidden md:table-cell">Categoría</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-28" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map(e => {
                      const due = e.due_date || e.expense_date;
                      const overdue = e.status === 'pending' && due < today;
                      return (
                        <TableRow key={e.id} className={e.status === 'cancelled' ? 'opacity-50' : ''}>
                          <TableCell className="whitespace-nowrap text-sm">{fmtDay(e.expense_date)}</TableCell>
                          <TableCell>
                            <div className="font-medium leading-tight">{e.description}</div>
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                              {e.vendor && <span>{e.vendor}</span>}
                              {e.is_fixed && <Badge variant="outline" className="text-[10px]">Fijo</Badge>}
                              {(e.recurrence === 'monthly' || e.recurrence_parent) && (
                                <Badge variant="outline" className="gap-1 text-[10px]"><Repeat className="h-3 w-3" />Mensual</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">{EXPENSE_CATEGORY_LABEL[e.category] || e.category}</TableCell>
                          <TableCell className="whitespace-nowrap text-sm">
                            {e.status === 'paid' && <span className="text-emerald-700 dark:text-emerald-400">Pagado {fmtDay(e.paid_at)}</span>}
                            {e.status === 'pending' && <span className={overdue ? 'font-medium text-red-600' : 'text-amber-700 dark:text-amber-400'}>{overdue ? 'Vencido' : 'Vence'} {fmtDay(due)}</span>}
                            {e.status === 'cancelled' && <span className="text-muted-foreground">Anulado</span>}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">{money(e.amount)}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              {e.status === 'pending' && (
                                <Button size="sm" variant="outline" onClick={() => setPaying(e)}>Pagar</Button>
                              )}
                              {e.status !== 'cancelled' && (
                                <>
                                  <Button size="icon" variant="ghost" aria-label="Editar" onClick={() => { setEditing(e); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                  <Button size="icon" variant="ghost" aria-label="Anular" onClick={() => cancel.mutate(e.id)}><Ban className="h-4 w-4" /></Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por categoría</CardTitle>
            <CardDescription>Dónde se va la plata este mes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {byCategory.length === 0 ? <p className="text-sm text-muted-foreground">Sin datos.</p> : byCategory.map(([cat, amount]) => (
              <div key={cat}>
                <div className="flex justify-between text-sm">
                  <span>{EXPENSE_CATEGORY_LABEL[cat] || cat}</span>
                  <span className="tabular-nums">{money(amount)}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-muted">
                  <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.max(2, (amount / (byCategory[0][1] || 1)) * 100)}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <ExpenseDialog open={dialogOpen} onOpenChange={setDialogOpen} expense={editing} accounts={accounts}
        onSave={e => save.mutateAsync(e)} saving={save.isPending} />
      <PayDialog
        open={!!paying}
        onOpenChange={o => !o && setPaying(null)}
        title={paying?.description || ''}
        amount={paying?.amount || 0}
        accounts={accounts}
        saving={markPaid.isPending}
        onConfirm={async p => { if (paying) await markPaid.mutateAsync({ source: 'expense', id: paying.id, ...p }); setPaying(null); }}
      />
    </div>
  );
};

export default ExpensesPanel;
