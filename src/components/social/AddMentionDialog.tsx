import React, { useState } from 'react';
import { Plus, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AddMentionSchema } from '@/lib/schemas/socialMention';
import { PLATFORM_OPTIONS } from './socialConfig';

interface Props {
  onAdd: (payload: any) => Promise<any>;
}

const initial = { platform: 'google', content: '', author_name: '', rating: 5 };

export const AddMentionDialog: React.FC<Props> = ({ onAdd }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial);

  const handleSubmit = async () => {
    const parsed = AddMentionSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Datos inválidos');
      return;
    }
    await onAdd({ ...parsed.data, published_at: new Date().toISOString() });
    setOpen(false);
    setForm(initial);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Mención
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Mención Manual</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Plataforma</Label>
              <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORM_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Calificación</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setForm({ ...form, rating: star })}
                  >
                    <Star
                      className={`h-6 w-6 ${star <= form.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Autor</Label>
            <Input
              value={form.author_name}
              onChange={(e) => setForm({ ...form, author_name: e.target.value })}
              placeholder="Nombre del usuario"
            />
          </div>
          <div className="grid gap-2">
            <Label>Contenido</Label>
            <Input
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Texto de la reseña o mención"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>Agregar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
