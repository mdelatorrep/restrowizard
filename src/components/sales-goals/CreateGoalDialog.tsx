import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { SalesGoalSchema } from '@/lib/schemas/salesGoal';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (form: any) => Promise<any> | any;
  trigger?: boolean;
}

const initial = () => ({
  period_type: 'monthly' as const,
  period_start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
  period_end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  revenue_goal: 0,
  covers_goal: 0,
  avg_ticket_goal: 0,
});

export const CreateGoalDialog = ({ open, onOpenChange, onCreate, trigger = true }: Props) => {
  const [goalForm, setGoalForm] = useState(initial());
  const { toast } = useToast();

  const handlePeriodTypeChange = (type: string) => {
    const today = new Date();
    let start: Date, end: Date;
    switch (type) {
      case 'daily': start = today; end = today; break;
      case 'weekly': start = startOfWeek(today, { weekStartsOn: 1 }); end = endOfWeek(today, { weekStartsOn: 1 }); break;
      case 'quarterly': {
        const q = Math.floor(today.getMonth() / 3);
        start = new Date(today.getFullYear(), q * 3, 1);
        end = new Date(today.getFullYear(), (q + 1) * 3, 0);
        break;
      }
      case 'monthly':
      default:
        start = startOfMonth(today); end = endOfMonth(today);
    }
    setGoalForm({ ...goalForm, period_type: type as any, period_start: format(start, 'yyyy-MM-dd'), period_end: format(end, 'yyyy-MM-dd') });
  };

  const handleCreate = async () => {
    const parsed = SalesGoalSchema.safeParse(goalForm);
    if (!parsed.success) {
      toast({ title: 'Error', description: parsed.error.errors[0]?.message || 'Datos inválidos', variant: 'destructive' });
      return;
    }
    await onCreate(parsed.data);
    onOpenChange(false);
    setGoalForm(initial());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <DialogTrigger asChild>
          <Button><Plus className="h-4 w-4 mr-2" />Nueva Meta</Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader><DialogTitle>Crear Meta de Ventas</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Tipo de Período</Label>
            <Select value={goalForm.period_type} onValueChange={handlePeriodTypeChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diario</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensual</SelectItem>
                <SelectItem value="quarterly">Trimestral</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Fecha Inicio</Label>
              <Input type="date" value={goalForm.period_start} onChange={(e) => setGoalForm({ ...goalForm, period_start: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Fecha Fin</Label>
              <Input type="date" value={goalForm.period_end} onChange={(e) => setGoalForm({ ...goalForm, period_end: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Meta de Ventas ($)</Label>
            <Input type="number" value={goalForm.revenue_goal} onChange={(e) => setGoalForm({ ...goalForm, revenue_goal: parseFloat(e.target.value) || 0 })} placeholder="5000000" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Meta de Clientes</Label>
              <Input type="number" value={goalForm.covers_goal} onChange={(e) => setGoalForm({ ...goalForm, covers_goal: parseInt(e.target.value) || 0 })} placeholder="500" />
            </div>
            <div className="grid gap-2">
              <Label>Ticket Promedio</Label>
              <Input type="number" value={goalForm.avg_ticket_goal} onChange={(e) => setGoalForm({ ...goalForm, avg_ticket_goal: parseFloat(e.target.value) || 0 })} placeholder="35000" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleCreate}>Crear Meta</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
