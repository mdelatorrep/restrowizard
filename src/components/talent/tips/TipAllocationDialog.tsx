import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/formatCurrency';
import { validateAllocationEdit, type TipAllocation } from '@/hooks/tips/tipsData';

type Edit = Pick<TipAllocation, 'id' | 'period_id' | 'manager_factor' | 'factor_reason' | 'adjustment' | 'adjustment_reason'>;

interface Props {
  allocation: TipAllocation | null;
  onOpenChange: (open: boolean) => void;
  onSave: (edit: Edit) => void;
  saving: boolean;
}

export const TipAllocationDialog = ({ allocation, onOpenChange, onSave, saving }: Props) => {
  const [factor, setFactor] = useState('1');
  const [factorReason, setFactorReason] = useState('');
  const [adjustment, setAdjustment] = useState('0');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!allocation) return;
    setFactor(String(allocation.manager_factor ?? 1));
    setFactorReason(allocation.factor_reason || '');
    setAdjustment(String(Math.round(Number(allocation.adjustment) || 0)));
    setAdjustmentReason(allocation.adjustment_reason || '');
    setError(null);
  }, [allocation]);

  if (!allocation) return null;

  const submit = () => {
    const edit: Edit = {
      id: allocation.id,
      period_id: allocation.period_id,
      manager_factor: Number(factor.replace(',', '.')),
      factor_reason: factorReason,
      adjustment: Math.round(Number(adjustment.replace(/[.\s$]/g, '').replace(',', '.'))),
      adjustment_reason: adjustmentReason,
    };
    const problem = validateAllocationEdit(edit);
    if (problem) return setError(problem);
    onSave(edit);
  };

  return (
    <Dialog open={!!allocation} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{allocation.staff_name}</DialogTitle>
          <DialogDescription>
            {allocation.position} · {allocation.days_worked} días · hoy recibe {formatCurrency(Math.round(allocation.total_amount), 'COP')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="tip-factor">Factor del gerente (0 a 2)</Label>
            <Input id="tip-factor" inputMode="decimal" value={factor} onChange={e => setFactor(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Multiplica sus puntos en el fondo común. 1 = normal. Lo que se le quita a una persona se reparte entre las demás.
            </p>
            {factor !== '1' && (
              <Input placeholder="Motivo (lo verá en su comprobante)" value={factorReason} onChange={e => setFactorReason(e.target.value)} />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tip-adj">Ajuste en pesos</Label>
            <Input id="tip-adj" inputMode="numeric" value={adjustment} onChange={e => setAdjustment(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Positivo suma, negativo resta. Para cerrar la quincena los ajustes de todos deben sumar cero.
            </p>
            {adjustment !== '0' && adjustment !== '' && (
              <Input placeholder="Motivo del ajuste" value={adjustmentReason} onChange={e => setAdjustmentReason(e.target.value)} />
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Guardar y recalcular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
