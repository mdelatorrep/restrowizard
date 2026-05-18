import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface StaffFormData {
  name: string;
  position: string;
  hourly_rate: string;
  performance_score: string;
  training_progress: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  formData: StaffFormData;
  setFormData: (f: StaffFormData) => void;
  onSubmit: () => void;
  trigger?: React.ReactNode;
}

export const StaffFormDialog: React.FC<Props> = ({ open, onOpenChange, formData, setFormData, onSubmit, trigger }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Agregar Empleado</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label>Nombre *</Label>
          <Input placeholder="Nombre completo" value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div>
          <Label>Posición *</Label>
          <Select value={formData.position} onValueChange={(v) => setFormData({ ...formData, position: v })}>
            <SelectTrigger><SelectValue placeholder="Seleccionar posición" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="chef">Chef</SelectItem>
              <SelectItem value="cocinero">Cocinero/a</SelectItem>
              <SelectItem value="ayudante_cocina">Ayudante de Cocina</SelectItem>
              <SelectItem value="mesero">Mesero/a</SelectItem>
              <SelectItem value="barista">Barista</SelectItem>
              <SelectItem value="cajero">Cajero/a</SelectItem>
              <SelectItem value="gerente">Gerente</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Tarifa por Hora</Label>
            <Input type="number" placeholder="0" value={formData.hourly_rate}
              onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })} />
          </div>
          <div>
            <Label>Rendimiento (%)</Label>
            <Input type="number" min="0" max="100" value={formData.performance_score}
              onChange={(e) => setFormData({ ...formData, performance_score: e.target.value })} />
          </div>
        </div>
        <Button onClick={onSubmit} className="w-full">Agregar Empleado</Button>
      </div>
    </DialogContent>
  </Dialog>
);
