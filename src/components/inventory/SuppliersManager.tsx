import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Truck, Plus, Edit, Trash2, Phone, Mail, MapPin, Star, Clock } from 'lucide-react';
import { InventorySupplier } from '@/hooks/useEnterpriseInventory';

interface Props {
  suppliers: InventorySupplier[];
  onCreate: (data: Partial<InventorySupplier>) => Promise<any>;
  onUpdate: (id: string, data: Partial<InventorySupplier>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const SuppliersManager = ({ suppliers, onCreate, onUpdate, onDelete }: Props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InventorySupplier | null>(null);
  const [formData, setFormData] = useState({
    supplier_name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    payment_terms: '',
    minimum_order: 0,
    delivery_days: '',
    lead_time_days: 1,
    notes: '',
    is_active: true,
    rating: 0
  });

  const resetForm = () => {
    setFormData({
      supplier_name: '',
      contact_name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      payment_terms: '',
      minimum_order: 0,
      delivery_days: '',
      lead_time_days: 1,
      notes: '',
      is_active: true,
      rating: 0
    });
    setEditing(null);
  };

  const handleEdit = (supplier: InventorySupplier) => {
    setEditing(supplier);
    setFormData({
      supplier_name: supplier.supplier_name,
      contact_name: supplier.contact_name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      city: supplier.city || '',
      payment_terms: supplier.payment_terms || '',
      minimum_order: supplier.minimum_order || 0,
      delivery_days: supplier.delivery_days || '',
      lead_time_days: supplier.lead_time_days,
      notes: supplier.notes || '',
      is_active: supplier.is_active,
      rating: supplier.rating || 0
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editing) {
      await onUpdate(editing.id, formData);
    } else {
      await onCreate(formData);
    }
    setDialogOpen(false);
    resetForm();
  };

  const renderStars = (rating: number | null) => {
    const stars = Math.round(rating || 0);
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star 
            key={i} 
            className={`h-4 w-4 ${i <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          Proveedores ({suppliers.length})
        </h3>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nombre del Proveedor *</Label>
                <Input
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  placeholder="Ej: Distribuidora ABC"
                />
              </div>
              <div>
                <Label>Contacto</Label>
                <Input
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  placeholder="Nombre del contacto"
                />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contacto@proveedor.com"
                />
              </div>
              <div>
                <Label>Ciudad</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Ciudad"
                />
              </div>
              <div className="col-span-2">
                <Label>Dirección</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Dirección completa"
                />
              </div>
              <div>
                <Label>Términos de Pago</Label>
                <Input
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  placeholder="Ej: Net 30, COD"
                />
              </div>
              <div>
                <Label>Pedido Mínimo ($)</Label>
                <Input
                  type="number"
                  value={formData.minimum_order}
                  onChange={(e) => setFormData({ ...formData, minimum_order: Number(e.target.value) })}
                  min={0}
                />
              </div>
              <div>
                <Label>Días de Entrega</Label>
                <Input
                  value={formData.delivery_days}
                  onChange={(e) => setFormData({ ...formData, delivery_days: e.target.value })}
                  placeholder="Ej: Lun, Mié, Vie"
                />
              </div>
              <div>
                <Label>Tiempo de Entrega (días)</Label>
                <Input
                  type="number"
                  value={formData.lead_time_days}
                  onChange={(e) => setFormData({ ...formData, lead_time_days: Number(e.target.value) })}
                  min={1}
                />
              </div>
              <div>
                <Label>Calificación (1-5)</Label>
                <Input
                  type="number"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: Math.min(5, Math.max(0, Number(e.target.value))) })}
                  min={0}
                  max={5}
                  step={0.5}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label>Activo</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
              </div>
              <div className="col-span-2">
                <Label>Notas</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas adicionales..."
                  rows={2}
                />
              </div>
              <div className="col-span-2 flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleSubmit} disabled={!formData.supplier_name}>
                  {editing ? 'Guardar' : 'Crear'}
                </Button>
              </div>
            </div>
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
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id} className={!supplier.is_active ? 'opacity-60' : ''}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{supplier.supplier_name}</p>
                      {supplier.email && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {supplier.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {supplier.contact_name && (
                      <p className="text-sm">{supplier.contact_name}</p>
                    )}
                    {supplier.phone && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {supplier.phone}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {supplier.city && (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {supplier.city}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-3 w-3" />
                      {supplier.lead_time_days} días
                    </div>
                  </TableCell>
                  <TableCell>{renderStars(supplier.rating)}</TableCell>
                  <TableCell>
                    <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                      {supplier.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(supplier)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive"
                      onClick={() => {
                        if (confirm('¿Eliminar este proveedor?')) {
                          onDelete(supplier.id);
                        }
                      }}
                    >
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
