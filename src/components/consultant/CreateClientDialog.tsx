import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CreateClientSchema } from '@/lib/schemas/consultantClient';

interface Props {
  onCreate: (payload: any) => Promise<any>;
}

const initial = {
  restaurant_name: '',
  restaurant_city: '',
  restaurant_cuisine_type: '',
  restaurant_email: '',
  restaurant_phone: '',
  monthly_fee: '',
  services_included: '',
};

export const CreateClientDialog: React.FC<Props> = ({ onCreate }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial);

  const handleSubmit = async () => {
    const parsed = CreateClientSchema.safeParse({
      ...form,
      monthly_fee: form.monthly_fee ? Number(form.monthly_fee) : undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Datos inválidos');
      return;
    }
    await onCreate({
      restaurant_name: parsed.data.restaurant_name,
      restaurant_city: parsed.data.restaurant_city,
      restaurant_cuisine_type: parsed.data.restaurant_cuisine_type,
      restaurant_email: parsed.data.restaurant_email,
      restaurant_phone: parsed.data.restaurant_phone,
      monthly_fee: parsed.data.monthly_fee,
      services_included: parsed.data.services_included
        ? parsed.data.services_included.split(',').map(s => s.trim())
        : undefined,
    });
    setForm(initial);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Crea un perfil para tu cliente. Podrás invitarlo a vincularse después.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nombre del Restaurante *</Label>
            <Input
              placeholder="Ej: Tacos Don Pepe"
              value={form.restaurant_name}
              onChange={(e) => setForm({ ...form, restaurant_name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ciudad</Label>
              <Input
                placeholder="Ej: CDMX"
                value={form.restaurant_city}
                onChange={(e) => setForm({ ...form, restaurant_city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Cocina</Label>
              <Select
                value={form.restaurant_cuisine_type || undefined}
                onValueChange={(value) => setForm({ ...form, restaurant_cuisine_type: value })}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mexicana">Mexicana</SelectItem>
                  <SelectItem value="italiana">Italiana</SelectItem>
                  <SelectItem value="japonesa">Japonesa</SelectItem>
                  <SelectItem value="china">China</SelectItem>
                  <SelectItem value="americana">Americana</SelectItem>
                  <SelectItem value="fusion">Fusión</SelectItem>
                  <SelectItem value="otra">Otra</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email (opcional)</Label>
              <Input
                type="email"
                placeholder="contacto@restaurante.com"
                value={form.restaurant_email}
                onChange={(e) => setForm({ ...form, restaurant_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                placeholder="55 1234 5678"
                value={form.restaurant_phone}
                onChange={(e) => setForm({ ...form, restaurant_phone: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tarifa Mensual (MXN)</Label>
            <Input
              type="number"
              placeholder="15000"
              value={form.monthly_fee}
              onChange={(e) => setForm({ ...form, monthly_fee: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Servicios incluidos</Label>
            <Input
              placeholder="Finanzas, Operaciones, Menú"
              value={form.services_included}
              onChange={(e) => setForm({ ...form, services_included: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Separa los servicios con comas</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
