import { useState } from 'react';
import { Reservation } from '@/hooks/useReservations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { ReservationSchema } from '@/lib/schemas/reservation';
import { toast } from 'sonner';

const INITIAL = {
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  party_size: 2,
  reservation_date: '',
  reservation_time: '',
  special_requests: '',
  source: 'phone' as 'phone' | 'walk_in' | 'website',
};

interface Props {
  onCreate: (data: any) => Promise<Reservation | null>;
}

export function CreateReservationDialog({ onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(INITIAL);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = ReservationSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Revisa los campos');
      return;
    }
    setLoading(true);
    const result = await onCreate({ ...parsed.data, party_size: Number(parsed.data.party_size) });
    setLoading(false);
    if (result) {
      setOpen(false);
      setForm(INITIAL);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-lg">
          <Plus className="h-4 w-4 mr-2" />
          Nueva reserva
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear reserva manual</DialogTitle>
          <DialogDescription>Registra una reserva hecha por teléfono o en persona</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre del cliente *</Label>
            <Input required value={form.customer_name} onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))} placeholder="Nombre completo" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Teléfono *</Label>
              <Input required value={form.customer_phone} onChange={e => setForm(p => ({ ...p, customer_phone: e.target.value }))} placeholder="+57 300..." />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.customer_email} onChange={e => setForm(p => ({ ...p, customer_email: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <Input type="date" required value={form.reservation_date} onChange={e => setForm(p => ({ ...p, reservation_date: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Hora *</Label>
              <Input type="time" required value={form.reservation_time} onChange={e => setForm(p => ({ ...p, reservation_time: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Personas *</Label>
              <Input type="number" required min={1} value={form.party_size} onChange={e => setForm(p => ({ ...p, party_size: parseInt(e.target.value) }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Fuente</Label>
            <Select value={form.source} onValueChange={v => setForm(p => ({ ...p, source: v as any }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">Teléfono</SelectItem>
                <SelectItem value="walk_in">En persona</SelectItem>
                <SelectItem value="website">Sitio web</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={form.special_requests} onChange={e => setForm(p => ({ ...p, special_requests: e.target.value }))} rows={2} placeholder="Peticiones especiales, alergias..." />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Crear reserva
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
