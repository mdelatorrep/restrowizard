import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PAYMENT_METHODS, type FinanceAccount } from '@/hooks/finance/financeIntegral';
import { todayBusinessDay } from '@/lib/businessDay';
import { money } from './FinanceUi';

export const PayDialog: React.FC<{
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  amount: number;
  accounts: FinanceAccount[];
  saving?: boolean;
  onConfirm: (p: { paid_at: string; payment_method: string; account_id: string | null }) => Promise<void>;
}> = ({ open, onOpenChange, title, amount, accounts, saving, onConfirm }) => {
  const [paidAt, setPaidAt] = useState(todayBusinessDay());
  const [method, setMethod] = useState<string>('Transferencia');
  const [account, setAccount] = useState<string>('none');

  useEffect(() => {
    if (open) { setPaidAt(todayBusinessDay()); setMethod('Transferencia'); setAccount(accounts[0]?.id || 'none'); }
  }, [open, accounts]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>{title} · {money(amount)}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="pay-date">Fecha de pago</Label>
            <Input id="pay-date" type="date" value={paidAt} onChange={e => setPaidAt(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Medio de pago</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {accounts.length > 0 && (
            <div className="grid gap-1.5">
              <Label>Cuenta</Label>
              <Select value={account} onValueChange={setAccount}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin especificar</SelectItem>
                  {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">El saldo de la cuenta no se descuenta solo: actualízalo en Flujo de caja cuando concilies con el extracto.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={!paidAt || saving} onClick={() => onConfirm({ paid_at: paidAt, payment_method: method, account_id: account === 'none' ? null : account })}>
            {saving ? 'Guardando…' : 'Confirmar pago'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
