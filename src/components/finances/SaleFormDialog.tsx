import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export interface SaleFormData {
  sale_date: string;
  total_revenue: string;
  covers_count: string;
  food_cost: string;
  labor_cost: string;
  other_costs: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  formData: SaleFormData;
  setFormData: (f: SaleFormData) => void;
  onSubmit: () => void;
  trigger?: React.ReactNode;
}

export const SaleFormDialog: React.FC<Props> = ({ open, onOpenChange, formData, setFormData, onSubmit, trigger }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Registrar Venta Diaria</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label>Fecha</Label>
          <Input type="date" value={formData.sale_date}
            onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })} />
        </div>
        <div>
          <Label>Ingreso Total *</Label>
          <Input type="number" placeholder="0" value={formData.total_revenue}
            onChange={(e) => setFormData({ ...formData, total_revenue: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Cubiertos</Label>
            <Input type="number" placeholder="0" value={formData.covers_count}
              onChange={(e) => setFormData({ ...formData, covers_count: e.target.value })} />
          </div>
          <div>
            <Label>Costo Alimentos</Label>
            <Input type="number" placeholder="0" value={formData.food_cost}
              onChange={(e) => setFormData({ ...formData, food_cost: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Costo Mano de Obra</Label>
            <Input type="number" placeholder="0" value={formData.labor_cost}
              onChange={(e) => setFormData({ ...formData, labor_cost: e.target.value })} />
          </div>
          <div>
            <Label>Otros Costos</Label>
            <Input type="number" placeholder="0" value={formData.other_costs}
              onChange={(e) => setFormData({ ...formData, other_costs: e.target.value })} />
          </div>
        </div>
        <Button onClick={onSubmit} className="w-full">Guardar Registro</Button>
      </div>
    </DialogContent>
  </Dialog>
);
