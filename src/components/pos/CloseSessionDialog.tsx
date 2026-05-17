import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Calculator } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: any;
  onClose: (amount: number, notes?: string) => void;
}

export const CloseSessionDialog = ({ open, onOpenChange, session, onClose }: Props) => {
  const [actualCash, setActualCash] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    onClose(parseFloat(actualCash) || 0, notes || undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Cerrar Caja
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {session && (
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Efectivo inicial:</span>
                <span>${Number(session.opening_cash).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ventas:</span>
                <span>${Number(session.total_sales).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Propinas:</span>
                <span>${Number(session.total_tips).toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total de ventas:</span>
                <span>{session.sales_count}</span>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="actual">Efectivo en Caja</Label>
            <Input
              id="actual"
              type="number"
              value={actualCash}
              onChange={(e) => setActualCash(e.target.value)}
              placeholder="Contar efectivo actual"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones del cierre"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} variant="destructive">
            Cerrar Caja
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
