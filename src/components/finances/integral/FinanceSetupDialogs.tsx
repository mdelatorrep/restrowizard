import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FinanceAccount, FinanceSettings } from '@/hooks/finance/financeIntegral';
import { useFinanceAccounts, useFinanceSettings } from '@/hooks/finance/useFinanceIntegral';
import { todayBusinessDay } from '@/lib/businessDay';
import { fmtDay, money, parseMoneyInput } from './FinanceUi';

const TYPE_LABEL: Record<FinanceAccount['account_type'], string> = { bank: 'Banco', cash: 'Caja / efectivo', wallet: 'Billetera digital' };

export const AccountsDialog: React.FC<{ open: boolean; onOpenChange: (o: boolean) => void }> = ({ open, onOpenChange }) => {
  const { accounts, upsert, archive } = useFinanceAccounts();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<FinanceAccount['account_type']>('bank');
  const [newBalance, setNewBalance] = useState('');

  useEffect(() => {
    if (open) setDraft(Object.fromEntries(accounts.map(a => [a.id, String(Math.round(a.balance))])));
  }, [open, accounts]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Saldos de hoy</DialogTitle>
          <DialogDescription>El flujo de caja arranca de aquí. Actualízalos con el extracto del banco y el conteo de caja menor.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {accounts.map(a => (
            <div key={a.id} className="grid grid-cols-[1fr_9rem_auto_auto] items-end gap-2 rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{a.name}</p>
                <p className="text-xs text-muted-foreground">{TYPE_LABEL[a.account_type]} · al {fmtDay(a.balance_as_of)}</p>
              </div>
              <Input inputMode="numeric" aria-label={`Saldo ${a.name}`}
                value={draft[a.id] ? Number(parseMoneyInput(draft[a.id])).toLocaleString('es-CO') : ''}
                onChange={e => setDraft(d => ({ ...d, [a.id]: e.target.value }))} />
              <Button size="sm" variant="outline" disabled={upsert.isPending}
                onClick={() => upsert.mutate({ ...a, balance: parseMoneyInput(draft[a.id] || '0'), balance_as_of: todayBusinessDay() })}>
                Guardar
              </Button>
              <Button size="icon" variant="ghost" aria-label="Quitar cuenta" onClick={() => archive.mutate(a.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-dashed p-3">
            <Input placeholder="Nombre (ej. Bancolombia corriente)" value={newName} onChange={e => setNewName(e.target.value)} className="col-span-2" />
            <Select value={newType} onValueChange={v => setNewType(v as FinanceAccount['account_type'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(TYPE_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
            </Select>
            <Input inputMode="numeric" placeholder="Saldo $" value={newBalance ? Number(parseMoneyInput(newBalance)).toLocaleString('es-CO') : ''}
              onChange={e => setNewBalance(e.target.value)} />
            <Button className="col-span-2" variant="secondary" disabled={!newName.trim() || upsert.isPending}
              onClick={async () => {
                await upsert.mutateAsync({ name: newName, account_type: newType, balance: parseMoneyInput(newBalance) });
                setNewName(''); setNewBalance('');
              }}>
              <Plus className="mr-2 h-4 w-4" />Agregar cuenta
            </Button>
          </div>
          <p className="text-right text-sm">Total: <strong>{money(accounts.reduce((s, a) => s + a.balance, 0))}</strong></p>
        </div>
        <DialogFooter><Button onClick={() => onOpenChange(false)}>Listo</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const FIELDS: { key: keyof FinanceSettings; label: string; hint: string; suffix: string }[] = [
  { key: 'card_fee_pct', label: 'Comisión datáfono', hint: 'Incluye el IVA de la comisión', suffix: '%' },
  { key: 'card_withholding_pct', label: 'Retenciones del datáfono', hint: 'Retefuente, reteIVA, reteICA que descuenta el adquirente', suffix: '%' },
  { key: 'card_settlement_days', label: 'Días para que llegue el datáfono', hint: 'Normalmente 1 día hábil', suffix: 'días' },
  { key: 'digital_fee_pct', label: 'Comisión Nequi / QR', hint: 'Cero si recibes en cuenta propia', suffix: '%' },
  { key: 'rappi_commission_pct', label: 'Comisión Rappi', hint: 'Según tu contrato con la plataforma', suffix: '%' },
  { key: 'rappi_settlement_days', label: 'Días para que pague Rappi', hint: 'Ciclo de liquidación', suffix: 'días' },
  { key: 'supplier_payment_days', label: 'Plazo promedio con proveedores', hint: 'Para proyectar las compras futuras', suffix: 'días' },
  { key: 'min_cash_buffer', label: 'Colchón mínimo de caja', hint: 'Saldo por debajo del cual quieres una alerta', suffix: '$' },
];

export const FinanceSettingsDialog: React.FC<{ open: boolean; onOpenChange: (o: boolean) => void }> = ({ open, onOpenChange }) => {
  const { settings, save } = useFinanceSettings();
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) setForm(Object.fromEntries(FIELDS.map(f => [f.key, String(settings[f.key])])));
  }, [open, settings]);

  const submit = async () => {
    const values = Object.fromEntries(FIELDS.map(f => [f.key, f.suffix === '$' ? parseMoneyInput(form[f.key]) : Number(String(form[f.key]).replace(',', '.')) || 0])) as unknown as FinanceSettings;
    await save.mutateAsync(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Supuestos de caja</DialogTitle>
          <DialogDescription>Con esto se calcula cuánto y cuándo llega la plata de cada medio de pago.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          {FIELDS.map(f => (
            <div key={f.key} className="grid grid-cols-[1fr_7rem] items-center gap-3">
              <div>
                <Label htmlFor={`fs-${f.key}`}>{f.label}</Label>
                <p className="text-xs text-muted-foreground">{f.hint}</p>
              </div>
              <div className="flex items-center gap-1">
                <Input id={`fs-${f.key}`} inputMode="decimal" value={form[f.key] ?? ''} onChange={e => setForm(s => ({ ...s, [f.key]: e.target.value }))} />
                <span className="text-xs text-muted-foreground">{f.suffix}</span>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={save.isPending}>{save.isPending ? 'Guardando…' : 'Guardar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
