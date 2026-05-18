import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Coins } from 'lucide-react';
import { AwardPointsSchema } from '@/lib/schemas/loyalty';
import { toast } from 'sonner';

interface PointsForm { points: number; reason: string; }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: PointsForm;
  onChange: (v: PointsForm) => void;
  customerName?: string;
  onSubmit: () => void | Promise<void>;
}

export const AwardPointsDialog = ({ open, onOpenChange, value, onChange, customerName, onSubmit }: Props) => {
  const handleSubmit = async () => {
    const parsed = AwardPointsSchema.safeParse(value);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Revisa los campos');
      return;
    }
    await onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Otorgar Puntos</DialogTitle>
          <DialogDescription>Añade puntos a {customerName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Puntos a otorgar</Label>
            <Input type="number" value={value.points} onChange={(e) => onChange({ ...value, points: parseInt(e.target.value) || 0 })} />
          </div>
          <div>
            <Label>Razón</Label>
            <Select value={value.reason} onValueChange={(v) => onChange({ ...value, reason: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Compra">Compra</SelectItem>
                <SelectItem value="Reseña">Reseña</SelectItem>
                <SelectItem value="Referido">Referido</SelectItem>
                <SelectItem value="Cumpleaños">Cumpleaños</SelectItem>
                <SelectItem value="Promoción">Promoción</SelectItem>
                <SelectItem value="Ajuste manual">Ajuste manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!value.points}>
            <Coins className="w-4 h-4 mr-2" /> Otorgar {value.points} puntos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
