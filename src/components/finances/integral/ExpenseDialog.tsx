import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABEL } from '@/hooks/finance/expenseAllocation';
import { PAYMENT_METHODS, type Expense, type FinanceAccount } from '@/hooks/finance/financeIntegral';
import type { ExpenseInput } from '@/hooks/finance/useFinanceIntegral';
import { todayBusinessDay } from '@/lib/businessDay';
import { parseMoneyInput } from './FinanceUi';

const FIXED_BY_DEFAULT = new Set(['arriendo', 'nomina_prestaciones', 'software_licencias', 'seguros']);

const empty = (): ExpenseInput => ({
  expense_date: todayBusinessDay(), category: 'servicios_publicos', description: '', vendor: '', amount: 0,
  is_fixed: false, status: 'pending', due_date: todayBusinessDay(), recurrence: 'none', notes: '',
  paid_at: todayBusinessDay(), payment_method: 'Transferencia', account_id: null,
});

export const ExpenseDialog: React.FC<{
  open: boolean;
  onOpenChange: (o: boolean) => void;
  expense?: Expense | null;
  accounts: FinanceAccount[];
  onSave: (e: ExpenseInput) => Promise<unknown>;
  saving?: boolean;
}> = ({ open, onOpenChange, expense, accounts, onSave, saving }) => {
  const [form, setForm] = useState<ExpenseInput>(empty());
  const [amountText, setAmountText] = useState('');

  useEffect(() => {
    if (!open) return;
    if (expense) {
      setForm({
        ...expense, vendor: expense.vendor || '', notes: expense.notes || '',
        paid_at: expense.paid_at || todayBusinessDay(), payment_method: expense.payment_method || 'Transferencia',
      });
      setAmountText(String(Math.round(expense.amount)));
    } else {
      setForm(empty());
      setAmountText('');
    }
  }, [open, expense]);

  const set = <K extends keyof ExpenseInput>(k: K, v: ExpenseInput[K]) => setForm(f => ({ ...f, [k]: v }));
  const amount = parseMoneyInput(amountText);
  const valid = form.description.trim().length > 0 && amount > 0 && !!form.expense_date;

  const submit = async () => {
    if (!valid) return;
    await onSave({ ...form, amount });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{expense ? 'Editar gasto' : 'Registrar gasto'}</DialogTitle>
          <DialogDescription>
            Todo lo que sale del negocio y no es insumo ni nómina por turnos: arriendo, servicios, prestaciones, mercadeo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="exp-desc">Concepto</Label>
            <Input id="exp-desc" value={form.description} maxLength={160} placeholder="Arriendo local noviembre"
              onChange={e => set('description', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Categoría</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v, is_fixed: f.id ? f.is_fixed : FIXED_BY_DEFAULT.has(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{EXPENSE_CATEGORY_LABEL[c]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="exp-amount">Valor</Label>
              <Input id="exp-amount" inputMode="numeric" placeholder="$ 0" value={amountText ? Number(parseMoneyInput(amountText)).toLocaleString('es-CO') : ''}
                onChange={e => setAmountText(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="exp-vendor">Proveedor (opcional)</Label>
              <Input id="exp-vendor" value={form.vendor || ''} onChange={e => set('vendor', e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="exp-date">Fecha del gasto</Label>
              <Input id="exp-date" type="date" value={form.expense_date} onChange={e => set('expense_date', e.target.value)} />
            </div>
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Gasto fijo</p>
              <p className="text-xs text-muted-foreground">En el P&L se reparte en todos los días del mes, no el día que se paga.</p>
            </div>
            <Switch checked={form.is_fixed} onCheckedChange={v => set('is_fixed', v)} aria-label="Gasto fijo" />
          </div>
          {!form.id || form.recurrence === 'monthly' || !expense?.recurrence_parent ? (
            <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Se repite cada mes</p>
                <p className="text-xs text-muted-foreground">Queda pendiente el mismo día de cada mes y entra al flujo de caja.</p>
              </div>
              <Switch checked={form.recurrence === 'monthly'} onCheckedChange={v => set('recurrence', v ? 'monthly' : 'none')} aria-label="Se repite cada mes" />
            </div>
          ) : null}

          <div className="grid gap-1.5">
            <Label>Estado</Label>
            <Select value={form.status === 'cancelled' ? 'pending' : form.status} onValueChange={v => set('status', v as ExpenseInput['status'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Por pagar</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.status === 'paid' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="exp-paid">Fecha de pago</Label>
                <Input id="exp-paid" type="date" value={form.paid_at || ''} onChange={e => set('paid_at', e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Medio</Label>
                <Select value={form.payment_method || 'Transferencia'} onValueChange={v => set('payment_method', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {accounts.length > 0 && (
                <div className="col-span-2 grid gap-1.5">
                  <Label>Cuenta de donde salió</Label>
                  <Select value={form.account_id || 'none'} onValueChange={v => set('account_id', v === 'none' ? null : v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin especificar</SelectItem>
                      {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-1.5">
              <Label htmlFor="exp-due">Vence</Label>
              <Input id="exp-due" type="date" value={form.due_date || ''} onChange={e => set('due_date', e.target.value)} />
            </div>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="exp-notes">Notas</Label>
            <Textarea id="exp-notes" rows={2} value={form.notes || ''} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!valid || saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
