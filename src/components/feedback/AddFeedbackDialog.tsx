import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { CustomerFeedbackSchema } from '@/lib/schemas/feedback';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: any) => Promise<void>;
}

export const AddFeedbackDialog = ({ open, onOpenChange, onAdd }: Props) => {
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    rating: 5,
    comment: '',
    source: 'in_store',
  });

  const handleSubmit = async () => {
    const parsed = CustomerFeedbackSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }
    await onAdd(form);
    onOpenChange(false);
    setForm({ customer_name: '', customer_email: '', rating: 5, comment: '', source: 'in_store' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Feedback</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Nombre del Cliente</Label>
            <Input
              value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.customer_email}
              onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label>Calificación</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setForm({ ...form, rating: star })}
                >
                  <Star
                    className={`h-8 w-8 ${star <= form.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Comentario</Label>
            <Textarea
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              placeholder="¿Qué opinó el cliente?"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
