import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
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
  // LATAM/Colombia additions
  employee_id?: string;       // documento de identidad (cédula)
  email?: string;
  phone?: string;
  contract_type?: string;     // término fijo, indefinido, prestación, aprendiz, otro
  hire_date?: string;         // fecha de ingreso (YYYY-MM-DD)
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
    <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Agregar Empleado</DialogTitle>
        <DialogDescription>
          Captura los datos laborales básicos (Colombia/LATAM): cédula, contrato, fecha de ingreso, contacto y tarifa.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <Label>Nombre *</Label>
          <Input placeholder="Nombre completo" value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Documento de identidad</Label>
            <Input placeholder="Cédula / CC" value={formData.employee_id ?? ''}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })} />
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Teléfono</Label>
            <Input placeholder="300 000 0000" value={formData.phone ?? ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" placeholder="empleado@correo.com" value={formData.email ?? ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Tipo de contrato</Label>
            <Select
              value={formData.contract_type ?? ''}
              onValueChange={(v) => setFormData({ ...formData, contract_type: v })}
            >
              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="termino_fijo">Término fijo</SelectItem>
                <SelectItem value="indefinido">Indefinido</SelectItem>
                <SelectItem value="prestacion_servicios">Prestación de servicios</SelectItem>
                <SelectItem value="aprendiz_sena">Aprendiz SENA</SelectItem>
                <SelectItem value="ocasional">Ocasional / por horas</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Fecha de ingreso</Label>
            <Input type="date" value={formData.hire_date ?? ''}
              onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Tarifa por Hora</Label>
            <Input type="number" min="0" placeholder="0" value={formData.hourly_rate}
              onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })} />
          </div>
          <div>
            <Label>Rendimiento (%)</Label>
            <Input type="number" min="0" max="100" value={formData.performance_score}
              onChange={(e) => setFormData({ ...formData, performance_score: e.target.value })} />
          </div>
          <div>
            <Label>Capacitación (%)</Label>
            <Input type="number" min="0" max="100" value={formData.training_progress}
              onChange={(e) => setFormData({ ...formData, training_progress: e.target.value })} />
          </div>
        </div>

        <Button onClick={onSubmit} className="w-full">Agregar Empleado</Button>
      </div>
    </DialogContent>
  </Dialog>
);
