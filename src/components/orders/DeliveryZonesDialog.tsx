import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { DeliveryZoneSchema } from '@/lib/schemas/order';

interface Zone {
  id: string;
  zone_name: string;
  delivery_fee?: number | null;
  min_order?: number | null;
  estimated_time_minutes?: number | null;
  is_active?: boolean | null;
}

interface Props {
  zones: Zone[];
  onCreate: (payload: any) => Promise<any>;
}

const initialForm = {
  zone_name: '',
  delivery_fee: 0,
  min_order: 0,
  estimated_time_minutes: 30,
};

export const DeliveryZonesDialog: React.FC<Props> = ({ zones, onCreate }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const handleCreate = async () => {
    const parsed = DeliveryZoneSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Datos inválidos');
      return;
    }
    await onCreate(parsed.data);
    setForm(initialForm);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <MapPin className="h-4 w-4 mr-2" />
          Zonas
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gestionar Zonas de Delivery</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {(zones || []).length > 0 && (
            <div className="space-y-2">
              {(zones || []).map(zone => (
                <div key={zone.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{zone.zone_name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${zone.delivery_fee?.toLocaleString()} • Min: ${zone.min_order?.toLocaleString()} • ~{zone.estimated_time_minutes} min
                    </p>
                  </div>
                  <Badge variant={zone.is_active ? 'default' : 'secondary'}>
                    {zone.is_active ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          <div className="border-t pt-4">
            <p className="font-medium mb-3">Nueva Zona</p>
            <div className="grid gap-3">
              <Input
                placeholder="Nombre de la zona"
                value={form.zone_name}
                onChange={(e) => setForm({ ...form, zone_name: e.target.value })}
              />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Tarifa</Label>
                  <Input
                    type="number"
                    value={form.delivery_fee}
                    onChange={(e) => setForm({ ...form, delivery_fee: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Mínimo</Label>
                  <Input
                    type="number"
                    value={form.min_order}
                    onChange={(e) => setForm({ ...form, min_order: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Tiempo (min)</Label>
                  <Input
                    type="number"
                    value={form.estimated_time_minutes}
                    onChange={(e) => setForm({ ...form, estimated_time_minutes: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <Button onClick={handleCreate}>Agregar Zona</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
