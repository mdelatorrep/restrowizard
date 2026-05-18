import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FeedbackCampaignSchema } from '@/lib/schemas/feedback';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: { name: string; incentive: string }) => Promise<void>;
}

export const CreateCampaignDialog = ({ open, onOpenChange, onCreate }: Props) => {
  const [form, setForm] = useState({ name: '', incentive: '' });

  const handleSubmit = async () => {
    const parsed = FeedbackCampaignSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }
    await onCreate(form);
    onOpenChange(false);
    setForm({ name: '', incentive: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Campaña de Feedback</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Nombre de la Campaña</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: QR Mesas Enero"
            />
          </div>
          <div className="grid gap-2">
            <Label>Incentivo (opcional)</Label>
            <Input
              value={form.incentive}
              onChange={(e) => setForm({ ...form, incentive: e.target.value })}
              placeholder="Ej: 10% descuento próxima visita"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>Crear Campaña</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
