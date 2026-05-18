import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { SupplierSchema } from '@/lib/schemas/supplier';
import { SUPPLIER_CATEGORIES } from './supplierCategories';
import { toast } from 'sonner';

export interface SupplierFormData {
  supplier_name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  category: string;
  payment_terms: string;
  minimum_order: number;
  delivery_days: string;
  lead_time_days: number;
  rating: number;
  is_active: boolean;
  notes: string;
}

interface Props {
  open: boolean;
  editing: boolean;
  value: SupplierFormData;
  onChange: (v: SupplierFormData) => void;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
}

export function SupplierFormDialog({ open, editing, value, onChange, onClose, onSubmit }: Props) {
  const set = (patch: Partial<SupplierFormData>) => onChange({ ...value, ...patch });

  const handleSubmit = async () => {
    const parsed = SupplierSchema.safeParse(value);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Revisa los campos');
      return;
    }
    await onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
          <DialogDescription>
            {editing ? 'Actualiza la información del proveedor' : 'Agrega un nuevo proveedor a tu red'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre de la Empresa *</Label>
              <Input value={value.supplier_name} onChange={e => set({ supplier_name: e.target.value })} placeholder="Distribuidora ABC" />
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={value.category || undefined} onValueChange={v => set({ category: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {SUPPLIER_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contacto</Label>
              <Input value={value.contact_name} onChange={e => set({ contact_name: e.target.value })} placeholder="Juan Pérez" />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={value.phone} onChange={e => set({ phone: e.target.value })} placeholder="+57 300 123 4567" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={value.email} onChange={e => set({ email: e.target.value })} placeholder="ventas@proveedor.com" />
            </div>
            <div className="space-y-2">
              <Label>Ciudad</Label>
              <Input value={value.city} onChange={e => set({ city: e.target.value })} placeholder="Ciudad" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Dirección</Label>
            <Input value={value.address} onChange={e => set({ address: e.target.value })} placeholder="Calle 123 #45-67" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Términos de Pago</Label>
              <Select value={value.payment_terms || undefined} onValueChange={v => set({ payment_terms: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="contado">Contado</SelectItem>
                  <SelectItem value="8_dias">8 días</SelectItem>
                  <SelectItem value="15_dias">15 días</SelectItem>
                  <SelectItem value="30_dias">30 días</SelectItem>
                  <SelectItem value="45_dias">45 días</SelectItem>
                  <SelectItem value="60_dias">60 días</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tiempo de Entrega (días)</Label>
              <Input type="number" value={value.lead_time_days} onChange={e => set({ lead_time_days: parseInt(e.target.value) || 1 })} min={1} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pedido Mínimo ($)</Label>
              <Input type="number" value={value.minimum_order} onChange={e => set({ minimum_order: parseFloat(e.target.value) || 0 })} min={0} />
            </div>
            <div className="space-y-2">
              <Label>Días de Entrega</Label>
              <Input value={value.delivery_days} onChange={e => set({ delivery_days: e.target.value })} placeholder="Lun, Mié, Vie" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Calificación (0-5)</Label>
              <Input
                type="number"
                value={value.rating}
                onChange={e => set({ rating: Math.min(5, Math.max(0, parseFloat(e.target.value) || 0)) })}
                min={0} max={5} step={0.5}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch checked={value.is_active} onCheckedChange={v => set({ is_active: v })} />
              <Label>Proveedor Activo</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={value.notes} onChange={e => set({ notes: e.target.value })} placeholder="Información adicional..." rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!value.supplier_name}>
            {editing ? 'Actualizar' : 'Crear Proveedor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
