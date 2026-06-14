import { useState, useMemo, useEffect } from 'react';
import { Reservation, findOverlappingReservation } from '@/hooks/useReservations';
import { useReservations } from '@/hooks/useReservations';
import { usePOSTables } from '@/hooks/usePOSTables';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ReservationSchema } from '@/lib/schemas/reservation';
import { toast } from 'sonner';

const NO_TABLE = '__none__';

const INITIAL = {
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  party_size: 2,
  reservation_date: '',
  reservation_time: '',
  special_requests: '',
  source: 'phone' as 'phone' | 'walk_in' | 'website',
  table_id: null as string | null,
  duration_minutes: 90,
};

interface Props {
  onCreate: (data: any) => Promise<Reservation | null>;
}

export function CreateReservationDialog({ onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(INITIAL);

  const { tables } = usePOSTables();
  const { reservations } = useReservations();

  // TK-J: marcar mesas no aptas por capacidad o por solapamiento
  const tableOptions = useMemo(() => {
    return (tables || []).map(t => {
      const overCapacity = t.capacity < form.party_size;
      const conflict = form.reservation_date && form.reservation_time
        ? findOverlappingReservation(
            reservations,
            t.id,
            form.reservation_date,
            form.reservation_time,
            form.duration_minutes,
          )
        : null;
      return {
        id: t.id,
        label: `Mesa ${t.table_number} · ${t.capacity} pax`,
        disabled: overCapacity || !!conflict,
        reason: overCapacity ? 'aforo insuficiente' : conflict ? 'ocupada en esa franja' : '',
      };
    });
  }, [tables, reservations, form.party_size, form.reservation_date, form.reservation_time, form.duration_minutes]);

  // Auto-clear table if it becomes invalid
  useEffect(() => {
    if (!form.table_id) return;
    const opt = tableOptions.find(o => o.id === form.table_id);
    if (opt?.disabled) setForm(p => ({ ...p, table_id: null }));
  }, [tableOptions, form.table_id]);

  const selectedTable = tableOptions.find(o => o.id === form.table_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = ReservationSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Revisa los campos');
      return;
    }
    setLoading(true);
    const result = await onCreate({
      ...parsed.data,
      party_size: Number(parsed.data.party_size),
      table_id: form.table_id,
      duration_minutes: form.duration_minutes,
    });
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear reserva manual</DialogTitle>
          <DialogDescription>Registra una reserva hecha por teléfono o en persona. Asigna una mesa para validar aforo y solapamiento.</DialogDescription>
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
              <Input type="number" required min={1} value={form.party_size} onChange={e => setForm(p => ({ ...p, party_size: parseInt(e.target.value) || 1 }))} />
            </div>
          </div>

          {/* TK-J: asignación de mesa + duración */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duración (min)</Label>
              <Input
                type="number"
                min={15}
                step={15}
                value={form.duration_minutes}
                onChange={e => setForm(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 90 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Mesa</Label>
              <Select
                value={form.table_id || NO_TABLE}
                onValueChange={v => setForm(p => ({ ...p, table_id: v === NO_TABLE ? null : v }))}
              >
                <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TABLE}>— Sin asignar —</SelectItem>
                  {tableOptions.map(t => (
                    <SelectItem key={t.id} value={t.id} disabled={t.disabled}>
                      {t.label}{t.disabled ? ` · ${t.reason}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.table_id && selectedTable && (
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{selectedTable.label} disponible en esa franja.</span>
            </div>
          )}
          {form.reservation_date && form.reservation_time && tableOptions.every(t => t.disabled) && tableOptions.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>No hay mesas disponibles para {form.party_size} pax en esa franja.</span>
            </div>
          )}

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
