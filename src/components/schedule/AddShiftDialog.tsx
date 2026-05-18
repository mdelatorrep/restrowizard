import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { StaffShiftSchema } from '@/lib/schemas/staffShift';

interface StaffOption { id: string; name: string }

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  staff: StaffOption[];
  onAdd: (data: any) => Promise<unknown>;
}

const defaultForm = () => ({
  staff_member_id: '',
  shift_date: format(new Date(), 'yyyy-MM-dd'),
  start_time: '09:00',
  end_time: '17:00',
  break_minutes: 30,
  notes: '',
});

export const AddShiftDialog: React.FC<Props> = ({ open, onOpenChange, staff, onAdd }) => {
  const [form, setForm] = useState(defaultForm());

  const handleSubmit = async () => {
    const parsed = StaffShiftSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Datos inválidos');
      return;
    }
    await onAdd({
      ...parsed.data,
      hourly_rate_override: null,
      actual_start_time: null,
      actual_end_time: null,
      status: 'scheduled',
      notes: parsed.data.notes || null,
    });
    setForm(defaultForm());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Turno
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Turno</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Empleado</Label>
            <Select value={form.staff_member_id} onValueChange={(v) => setForm({ ...form, staff_member_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona empleado..." />
              </SelectTrigger>
              <SelectContent>
                {(staff || []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Fecha</Label>
            <Input type="date" value={form.shift_date} onChange={(e) => setForm({ ...form, shift_date: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Hora Inicio</Label>
              <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div>
              <Label>Hora Fin</Label>
              <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Descanso (minutos)</Label>
            <Input
              type="number"
              value={form.break_minutes}
              onChange={(e) => setForm({ ...form, break_minutes: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label>Notas</Label>
            <Input
              placeholder="Notas opcionales..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <Button onClick={handleSubmit} className="w-full">Agregar Turno</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
