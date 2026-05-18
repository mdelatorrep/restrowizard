import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoyaltyRewardSchema } from '@/lib/schemas/loyalty';
import { toast } from 'sonner';

type RewardType = 'discount_percent' | 'discount_fixed' | 'free_item' | 'free_delivery' | 'experience' | 'upgrade';
interface RewardForm {
  name: string;
  description: string;
  points_required: number;
  reward_type: RewardType;
  reward_value: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: RewardForm;
  onChange: (v: RewardForm) => void;
  onSubmit: () => void | Promise<void>;
}

export const NewRewardDialog = ({ open, onOpenChange, value, onChange, onSubmit }: Props) => {
  const handleSubmit = async () => {
    const parsed = LoyaltyRewardSchema.safeParse(value);
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
          <DialogTitle>Nueva Recompensa</DialogTitle>
          <DialogDescription>Crea una recompensa para el catálogo de canjes</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nombre *</Label>
            <Input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} placeholder="Ej: Postre Gratis, 10% Descuento..." />
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea value={value.description} onChange={(e) => onChange({ ...value, description: e.target.value })} placeholder="Describe la recompensa..." />
          </div>
          <div>
            <Label>Puntos requeridos *</Label>
            <Input type="number" value={value.points_required} onChange={(e) => onChange({ ...value, points_required: parseInt(e.target.value) || 0 })} />
          </div>
          <div>
            <Label>Tipo de recompensa</Label>
            <Select value={value.reward_type} onValueChange={(v) => onChange({ ...value, reward_type: v as RewardType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="discount_percent">Descuento %</SelectItem>
                <SelectItem value="discount_fixed">Descuento $</SelectItem>
                <SelectItem value="free_item">Producto Gratis</SelectItem>
                <SelectItem value="free_delivery">Delivery Gratis</SelectItem>
                <SelectItem value="experience">Experiencia</SelectItem>
                <SelectItem value="upgrade">Upgrade</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Valor (si aplica)</Label>
            <Input type="number" value={value.reward_value} onChange={(e) => onChange({ ...value, reward_value: parseFloat(e.target.value) || 0 })} placeholder="Ej: 10 para 10%" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!value.name || !value.points_required}>Crear</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
