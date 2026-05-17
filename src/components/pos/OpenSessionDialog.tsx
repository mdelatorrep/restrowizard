import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DollarSign } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpen: (name: string, amount: number) => void;
}

export const OpenSessionDialog = ({ open, onOpenChange, onOpen }: Props) => {
  const [cashierName, setCashierName] = useState('');
  const [openingCash, setOpeningCash] = useState('');

  const handleSubmit = () => {
    if (!cashierName.trim()) return;
    onOpen(cashierName, parseFloat(openingCash) || 0);
    onOpenChange(false);
    setCashierName('');
    setOpeningCash('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Abrir Caja
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cashier">Nombre del Cajero</Label>
            <Input
              id="cashier"
              value={cashierName}
              onChange={(e) => setCashierName(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="opening">Efectivo Inicial</Label>
            <Input
              id="opening"
              type="number"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!cashierName.trim()}>
            Abrir Caja
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
