import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateServiceRequest } from '@/hooks/useServiceMarketplace';

const categories = [
  { value: 'equipment', label: 'Equipamiento' },
  { value: 'technology', label: 'Tecnología' },
  { value: 'food_supplies', label: 'Ingredientes' },
  { value: 'consulting', label: 'Consultoría' },
  { value: 'design', label: 'Diseño' },
  { value: 'catering', label: 'Catering' },
  { value: 'photography', label: 'Fotografía' },
  { value: 'other', label: 'Otro' },
];

interface ServiceRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ServiceRequestForm = ({ open, onOpenChange }: ServiceRequestFormProps) => {
  const [form, setForm] = useState({
    title: '', description: '', category: 'other', budget_min: '', budget_max: '',
    city: '', urgency: 'normal', deadline: '',
  });
  const createRequest = useCreateServiceRequest();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRequest.mutate({
      title: form.title,
      description: form.description || undefined,
      category: form.category,
      budget_min: form.budget_min ? parseInt(form.budget_min) : undefined,
      budget_max: form.budget_max ? parseInt(form.budget_max) : undefined,
      city: form.city || undefined,
      urgency: form.urgency,
      deadline: form.deadline || undefined,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setForm({ title: '', description: '', category: 'other', budget_min: '', budget_max: '', city: '', urgency: 'normal', deadline: '' });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Publicar Necesidad</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>¿Qué necesitas? *</Label>
            <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required
              placeholder="Ej: Proveedor de sistema POS, Diseño de carta..." />
          </div>
          <div className="space-y-2">
            <Label>Descripción detallada</Label>
            <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3}
              placeholder="Describe tu necesidad con detalle..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Urgencia</Label>
              <Select value={form.urgency} onValueChange={v => setForm(p => ({ ...p, urgency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Presupuesto mín (COP)</Label>
              <Input type="number" value={form.budget_min} onChange={e => setForm(p => ({ ...p, budget_min: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Presupuesto máx (COP)</Label>
              <Input type="number" value={form.budget_max} onChange={e => setForm(p => ({ ...p, budget_max: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ciudad</Label>
              <Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="Bogotá" />
            </div>
            <div className="space-y-2">
              <Label>Fecha límite</Label>
              <Input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={createRequest.isPending}>
            {createRequest.isPending ? 'Publicando...' : 'Publicar Necesidad'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceRequestForm;
