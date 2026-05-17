import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Controller } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Truck, Plus, Edit, Trash2, Phone, Mail, MapPin, Star, Clock } from 'lucide-react';
import { InventorySupplier } from '@/hooks/useEnterpriseInventory';
import { useZodForm } from '@/lib/forms';
import { SupplierSchema, type SupplierValues } from '@/lib/schemas/supplier';

interface Props {
  suppliers: InventorySupplier[];
  onCreate: (data: Partial<InventorySupplier>) => Promise<any>;
  onUpdate: (id: string, data: Partial<InventorySupplier>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const EMPTY: SupplierValues = {
  supplier_name: '', contact_name: '', email: '', phone: '', address: '', city: '',
  payment_terms: '', minimum_order: 0, delivery_days: '', lead_time_days: 1,
  notes: '', is_active: true, rating: 0,
};

export const SuppliersManager = ({ suppliers, onCreate, onUpdate, onDelete }: Props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InventorySupplier | null>(null);
  const form = useZodForm<SupplierValues>(SupplierSchema as any, { defaultValues: EMPTY });
  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = form;

  const resetAll = () => { reset(EMPTY); setEditing(null); };

  const handleEdit = (s: InventorySupplier) => {
    setEditing(s);
    reset({
      supplier_name: s.supplier_name,
      contact_name: s.contact_name || '',
      email: s.email || '',
      phone: s.phone || '',
      address: s.address || '',
      city: s.city || '',
      payment_terms: s.payment_terms || '',
      minimum_order: s.minimum_order || 0,
      delivery_days: s.delivery_days || '',
      lead_time_days: s.lead_time_days || 1,
      notes: s.notes || '',
      is_active: s.is_active,
      rating: s.rating || 0,
    });
    setDialogOpen(true);
  };

  const onSubmit = handleSubmit(async (values) => {
    if (editing) await onUpdate(editing.id, values);
    else await onCreate(values);
    setDialogOpen(false);
    resetAll();
  });

  const renderStars = (rating: number | null) => {
    const stars = Math.round(rating || 0);
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i}
            className={`h-4 w-4 ${i <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
        ))}
      </div>
    );
  };

  const err = (k: keyof SupplierValues) =>
    errors[k] ? <p className="text-xs text-destructive mt-1">{String(errors[k]?.message)}</p> : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          Proveedores ({suppliers.length})
        </h3>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetAll(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Nuevo Proveedor</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4" noValidate>
              <div className="col-span-2">
                <Label htmlFor="supplier_name">Nombre del Proveedor *</Label>
                <Input id="supplier_name" autoComplete="organization"
                  placeholder="Ej: Distribuidora ABC"
                  aria-invalid={!!errors.supplier_name} {...register('supplier_name')} />
                {err('supplier_name')}
              </div>
              <div>
                <Label htmlFor="contact_name">Contacto</Label>
                <Input id="contact_name" autoComplete="name" placeholder="Nombre del contacto"
                  {...register('contact_name')} />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" type="tel" autoComplete="tel" placeholder="+1 234 567 8900"
                  {...register('phone')} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email"
                  placeholder="contacto@proveedor.com"
                  aria-invalid={!!errors.email} {...register('email')} />
                {err('email')}
              </div>
              <div>
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" autoComplete="address-level2" placeholder="Ciudad" {...register('city')} />
              </div>
              <div className="col-span-2">
                <Label htmlFor="address">Dirección</Label>
                <Input id="address" autoComplete="street-address"
                  placeholder="Dirección completa" {...register('address')} />
              </div>
              <div>
                <Label htmlFor="payment_terms">Términos de Pago</Label>
                <Input id="payment_terms" placeholder="Ej: Net 30, COD" {...register('payment_terms')} />
              </div>
              <div>
                <Label htmlFor="minimum_order">Pedido Mínimo ($)</Label>
                <Input id="minimum_order" type="number" min={0} {...register('minimum_order')} />
              </div>
              <div>
                <Label htmlFor="delivery_days">Días de Entrega</Label>
                <Input id="delivery_days" placeholder="Ej: Lun, Mié, Vie" {...register('delivery_days')} />
              </div>
              <div>
                <Label htmlFor="lead_time_days">Tiempo de Entrega (días)</Label>
                <Input id="lead_time_days" type="number" min={1}
                  aria-invalid={!!errors.lead_time_days} {...register('lead_time_days')} />
                {err('lead_time_days')}
              </div>
              <div>
                <Label htmlFor="rating">Calificación (0-5)</Label>
                <Input id="rating" type="number" min={0} max={5} step={0.5}
                  aria-invalid={!!errors.rating} {...register('rating')} />
                {err('rating')}
              </div>
              <div className="flex items-center gap-2">
                <Label>Activo</Label>
                <Controller name="is_active" control={control} render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )} />
              </div>
              <div className="col-span-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea id="notes" rows={2} placeholder="Notas adicionales..." {...register('notes')} />
              </div>
              <div className="col-span-2 flex gap-2 pt-4">
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

      {suppliers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Sin proveedores registrados</p>
            <p className="text-sm">Agrega proveedores para gestionar compras</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proveedor</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Lead Time</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(suppliers || []).map((s) => (
                <TableRow key={s.id} className={!s.is_active ? 'opacity-60' : ''}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{s.supplier_name}</p>
                      {s.email && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />{s.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {s.contact_name && <p className="text-sm">{s.contact_name}</p>}
                    {s.phone && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />{s.phone}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {s.city && (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />{s.city}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-3 w-3" />{s.lead_time_days} días
                    </div>
                  </TableCell>
                  <TableCell>{renderStars(s.rating)}</TableCell>
                  <TableCell>
                    <Badge variant={s.is_active ? 'default' : 'secondary'}>
                      {s.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(s)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive"
                      onClick={() => { if (confirm('¿Eliminar este proveedor?')) onDelete(s.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};
