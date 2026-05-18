import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoyaltyTierSchema } from '@/lib/schemas/loyalty';
import { toast } from 'sonner';

interface TierForm { name: string; min_points: number; points_multiplier: number; color: string; }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: TierForm;
  onChange: (v: TierForm) => void;
  onSubmit: () => void | Promise<void>;
}

export const NewTierDialog = ({ open, onOpenChange, value, onChange, onSubmit }: Props) => {
  const handleSubmit = async () => {
    const parsed = LoyaltyTierSchema.safeParse(value);
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
          <DialogTitle>Crear Nivel</DialogTitle>
          <DialogDescription>Define un nuevo nivel para tu programa de fidelización</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nombre del nivel</Label>
            <Input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} placeholder="Ej: Oro, Platino, VIP..." />
          </div>
          <div>
            <Label>Puntos mínimos requeridos</Label>
            <Input type="number" value={value.min_points} onChange={(e) => onChange({ ...value, min_points: parseInt(e.target.value) || 0 })} />
          </div>
          <div>
            <Label>Multiplicador de puntos</Label>
            <Input type="number" step="0.1" value={value.points_multiplier} onChange={(e) => onChange({ ...value, points_multiplier: parseFloat(e.target.value) || 1 })} />
          </div>
          <div>
            <Label>Color</Label>
            <Input type="color" value={value.color} onChange={(e) => onChange({ ...value, color: e.target.value })} className="h-10 w-20" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>Crear Nivel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
