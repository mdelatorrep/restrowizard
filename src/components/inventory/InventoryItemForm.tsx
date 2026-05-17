import { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Barcode, Thermometer } from 'lucide-react';
import { InventoryItemExtended, StorageLocation, InventorySupplier } from '@/hooks/useEnterpriseInventory';
import { useZodForm } from '@/lib/forms';
import { InventoryItemSchema, type InventoryItemValues } from '@/lib/schemas/inventoryItem';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item?: InventoryItemExtended | null;
  locations: StorageLocation[];
  suppliers: InventorySupplier[];
  onCreate: (data: Partial<InventoryItemExtended>) => Promise<any>;
  onUpdate: (id: string, data: Partial<InventoryItemExtended>) => Promise<void>;
}

const categories = [
  'Vegetales', 'Frutas', 'Carnes', 'Pescados', 'Lácteos',
  'Granos', 'Bebidas', 'Condimentos', 'Limpieza', 'Empaques', 'Otros',
];

const units = [
  { value: 'unidades', label: 'Unidades' },
  { value: 'kg', label: 'Kilogramos' },
  { value: 'g', label: 'Gramos' },
  { value: 'lt', label: 'Litros' },
  { value: 'ml', label: 'Mililitros' },
  { value: 'lb', label: 'Libras' },
  { value: 'oz', label: 'Onzas' },
];

const EMPTY: InventoryItemValues = {
  item_name: '', category: '', current_stock: 0, unit: 'unidades', unit_cost: 0,
  reorder_point: 10, par_level: 0, max_level: 0, supplier_name: '',
  storage_location_id: '', preferred_supplier_id: '', barcode: '', sku: '',
  purchase_unit: '', purchase_quantity: 1, min_order_quantity: 1, lead_time_days: 1,
  is_perishable: false, shelf_life_days: 0, expiration_date: '', lot_number: '', notes: '',
};

export const InventoryItemForm = ({ isOpen, onClose, item, locations, suppliers, onCreate, onUpdate }: Props) => {
  const form = useZodForm<InventoryItemValues>(InventoryItemSchema as any, { defaultValues: EMPTY });
  const { register, handleSubmit, reset, control, watch, formState: { errors, isSubmitting } } = form;
  const isPerishable = watch('is_perishable');

  useEffect(() => {
    if (item) {
      reset({
        item_name: item.item_name,
        category: item.category || '',
        current_stock: item.current_stock,
        unit: item.unit,
        unit_cost: item.unit_cost || 0,
        reorder_point: item.reorder_point || 10,
        par_level: item.par_level || 0,
        max_level: item.max_level || 0,
        supplier_name: item.supplier_name || '',
        storage_location_id: item.storage_location_id || '',
        preferred_supplier_id: item.preferred_supplier_id || '',
        barcode: item.barcode || '',
        sku: item.sku || '',
        purchase_unit: item.purchase_unit || '',
        purchase_quantity: item.purchase_quantity || 1,
        min_order_quantity: item.min_order_quantity || 1,
        lead_time_days: item.lead_time_days || 1,
        is_perishable: item.is_perishable || false,
        shelf_life_days: item.shelf_life_days || 0,
        expiration_date: item.expiration_date || '',
        lot_number: item.lot_number || '',
        notes: item.notes || '',
      });
    } else {
      reset(EMPTY);
    }
  }, [item, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const data: Partial<InventoryItemExtended> = {
      ...values,
      storage_location_id: values.storage_location_id || undefined,
      preferred_supplier_id: values.preferred_supplier_id || undefined,
      expiration_date: values.expiration_date || undefined,
      max_level: values.max_level || undefined,
      shelf_life_days: values.shelf_life_days || undefined,
    };
    if (item) await onUpdate(item.id, data);
    else await onCreate(data);
    onClose();
  });

  const errMsg = (k: keyof InventoryItemValues) =>
    errors[k] ? <p className="text-xs text-destructive mt-1">{String(errors[k]?.message)}</p> : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {item ? 'Editar Ítem' : 'Nuevo Ítem de Inventario'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="stock">Stock</TabsTrigger>
              <TabsTrigger value="supplier">Proveedor</TabsTrigger>
              <TabsTrigger value="tracking">Tracking</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="item_name">Nombre del Ítem *</Label>
                <Input id="item_name" autoComplete="off" placeholder="Ej: Tomate Cherry"
                  aria-invalid={!!errors.item_name} {...register('item_name')} />
                {errMsg('item_name')}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categoría</Label>
                  <Controller name="category" control={control} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )} />
                </div>
                <div>
                  <Label>Ubicación</Label>
                  <Controller name="storage_location_id" control={control} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        {locations.filter(l => l.id).map(loc => (
                          <SelectItem key={loc.id} value={loc.id}>{loc.location_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Unidad</Label>
                  <Controller name="unit" control={control} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {units.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )} />
                </div>
                <div>
                  <Label htmlFor="unit_cost">Costo Unitario ($)</Label>
                  <Input id="unit_cost" type="number" min={0} step={0.01}
                    aria-invalid={!!errors.unit_cost} {...register('unit_cost')} />
                  {errMsg('unit_cost')}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-blue-500" />
                  <div>
                    <Label>Producto Perecedero</Label>
                    <p className="text-xs text-muted-foreground">Requiere control de temperatura</p>
                  </div>
                </div>
                <Controller name="is_perishable" control={control} render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )} />
              </div>
            </TabsContent>

            <TabsContent value="stock" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="current_stock">Stock Actual</Label>
                  <Input id="current_stock" type="number" min={0} {...register('current_stock')} />
                  {errMsg('current_stock')}
                </div>
                <div>
                  <Label htmlFor="reorder_point">Punto de Reorden</Label>
                  <Input id="reorder_point" type="number" min={0} {...register('reorder_point')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="par_level">Par Level (Nivel Óptimo)</Label>
                  <Input id="par_level" type="number" min={0} {...register('par_level')} />
                </div>
                <div>
                  <Label htmlFor="max_level">Stock Máximo</Label>
                  <Input id="max_level" type="number" min={0}
                    aria-invalid={!!errors.max_level} {...register('max_level')} />
                  {errMsg('max_level')}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_order_quantity">Cantidad Mínima de Orden</Label>
                  <Input id="min_order_quantity" type="number" min={1} {...register('min_order_quantity')} />
                </div>
                <div>
                  <Label htmlFor="lead_time_days">Tiempo de Entrega (días)</Label>
                  <Input id="lead_time_days" type="number" min={1} {...register('lead_time_days')} />
                </div>
              </div>
              {isPerishable && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shelf_life_days">Vida Útil (días)</Label>
                    <Input id="shelf_life_days" type="number" min={1} {...register('shelf_life_days')} />
                  </div>
                  <div>
                    <Label htmlFor="expiration_date">Fecha de Vencimiento</Label>
                    <Input id="expiration_date" type="date" {...register('expiration_date')} />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="supplier" className="space-y-4 mt-4">
              <div>
                <Label>Proveedor Preferido</Label>
                <Controller name="preferred_supplier_id" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar proveedor" /></SelectTrigger>
                    <SelectContent>
                      {suppliers.filter(s => s.id).map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.supplier_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div>
                <Label htmlFor="supplier_name">Nombre del Proveedor (legado)</Label>
                <Input id="supplier_name" placeholder="Si no está en la lista" {...register('supplier_name')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="purchase_unit">Unidad de Compra</Label>
                  <Input id="purchase_unit" placeholder="Ej: Caja, Bolsa" {...register('purchase_unit')} />
                </div>
                <div>
                  <Label htmlFor="purchase_quantity">Unidades por Compra</Label>
                  <Input id="purchase_quantity" type="number" min={1} {...register('purchase_quantity')} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tracking" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="barcode" className="flex items-center gap-2">
                    <Barcode className="h-4 w-4" /> Código de Barras
                  </Label>
                  <Input id="barcode" placeholder="1234567890" {...register('barcode')} />
                </div>
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" placeholder="SKU-001" {...register('sku')} />
                </div>
              </div>
              <div>
                <Label htmlFor="lot_number">Número de Lote</Label>
                <Input id="lot_number" placeholder="LOT-2024-001" {...register('lot_number')} />
              </div>
              <div>
                <Label htmlFor="notes">Notas</Label>
                <Textarea id="notes" rows={3}
                  placeholder="Notas adicionales sobre el producto..." {...register('notes')} />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {item ? 'Guardar Cambios' : 'Crear Ítem'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
