import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Controller } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Warehouse, Plus, Thermometer, Edit, Trash2 } from 'lucide-react';
import { StorageLocation } from '@/hooks/useEnterpriseInventory';
import { useZodForm } from '@/lib/forms';
import { StorageLocationSchema, type StorageLocationValues } from '@/lib/schemas/storageLocation';

interface Props {
  locations: StorageLocation[];
  onCreate: (data: Partial<StorageLocation>) => Promise<any>;
  onUpdate: (id: string, data: Partial<StorageLocation>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const locationTypes = [
  { value: 'dry_storage', label: 'Bodega Seca', icon: '📦' },
  { value: 'refrigerator', label: 'Refrigerador', icon: '❄️' },
  { value: 'freezer', label: 'Congelador', icon: '🧊' },
  { value: 'bar', label: 'Bar', icon: '🍸' },
  { value: 'prep_area', label: 'Área de Preparación', icon: '👨‍🍳' },
  { value: 'display', label: 'Exhibición', icon: '🪟' },
];

const EMPTY: StorageLocationValues = {
  location_name: '', location_type: 'dry_storage', temperature_range: '',
  description: '', is_active: true, sort_order: 0,
};

export const StorageLocationsManager = ({ locations, onCreate, onUpdate, onDelete }: Props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StorageLocation | null>(null);
  const form = useZodForm<StorageLocationValues>(StorageLocationSchema as any, { defaultValues: EMPTY });
  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = form;

  const resetAll = () => { reset(EMPTY); setEditing(null); };

  const handleEdit = (loc: StorageLocation) => {
    setEditing(loc);
    reset({
      location_name: loc.location_name,
      location_type: loc.location_type,
      temperature_range: loc.temperature_range || '',
      description: loc.description || '',
      is_active: loc.is_active,
      sort_order: loc.sort_order,
    });
    setDialogOpen(true);
  };

  const onSubmit = handleSubmit(async (values) => {
    if (editing) await onUpdate(editing.id, values);
    else await onCreate(values);
    setDialogOpen(false);
    resetAll();
  });

  const getTypeInfo = (type: string) =>
    locationTypes.find(t => t.value === type) || { label: type, icon: '📦' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Warehouse className="h-5 w-5 text-primary" />
          Ubicaciones de Almacenamiento
        </h3>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetAll(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Nueva Ubicación</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Ubicación' : 'Nueva Ubicación'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <div>
                <Label htmlFor="location_name">Nombre *</Label>
                <Input id="location_name" placeholder="Ej: Refrigerador Principal"
                  aria-invalid={!!errors.location_name} {...register('location_name')} />
                {errors.location_name && (
                  <p className="text-xs text-destructive mt-1">{errors.location_name.message}</p>
                )}
              </div>
              <div>
                <Label>Tipo</Label>
                <Controller name="location_type" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {locationTypes.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div>
                <Label htmlFor="temperature_range" className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4" /> Rango de Temperatura
                </Label>
                <Input id="temperature_range" placeholder="Ej: 2-4°C" {...register('temperature_range')} />
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" rows={2} placeholder="Notas adicionales..." {...register('description')} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Activa</Label>
                <Controller name="is_active" control={control} render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )} />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" className="flex-1"
                  onClick={() => { setDialogOpen(false); resetAll(); }}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {editing ? 'Guardar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {locations.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Warehouse className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Sin ubicaciones configuradas</p>
            <p className="text-sm">Agrega ubicaciones para organizar tu inventario</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(locations || []).map((loc) => {
            const typeInfo = getTypeInfo(loc.location_type);
            return (
              <Card key={loc.id} className={!loc.is_active ? 'opacity-60' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{typeInfo.icon}</span>
                      <div>
                        <CardTitle className="text-base">{loc.location_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{typeInfo.label}</p>
                      </div>
                    </div>
                    <Badge variant={loc.is_active ? 'default' : 'secondary'}>
                      {loc.is_active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {loc.temperature_range && (
                    <div className="flex items-center gap-2 text-sm">
                      <Thermometer className="h-4 w-4 text-blue-500" />
                      <span>{loc.temperature_range}</span>
                    </div>
                  )}
                  {loc.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{loc.description}</p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(loc)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive"
                      onClick={() => { if (confirm('¿Eliminar esta ubicación?')) onDelete(loc.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
