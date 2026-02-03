import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Barcode, Truck, Thermometer } from 'lucide-react';
import { InventoryItemExtended, StorageLocation, InventorySupplier } from '@/hooks/useEnterpriseInventory';

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
  'Granos', 'Bebidas', 'Condimentos', 'Limpieza', 'Empaques', 'Otros'
];

const units = [
  { value: 'unidades', label: 'Unidades' },
  { value: 'kg', label: 'Kilogramos' },
  { value: 'g', label: 'Gramos' },
  { value: 'lt', label: 'Litros' },
  { value: 'ml', label: 'Mililitros' },
  { value: 'lb', label: 'Libras' },
  { value: 'oz', label: 'Onzas' }
];

export const InventoryItemForm = ({ isOpen, onClose, item, locations, suppliers, onCreate, onUpdate }: Props) => {
  const [formData, setFormData] = useState({
    item_name: '',
    category: '',
    current_stock: 0,
    unit: 'unidades',
    unit_cost: 0,
    reorder_point: 10,
    par_level: 0,
    max_level: 0,
    supplier_name: '',
    storage_location_id: '',
    preferred_supplier_id: '',
    barcode: '',
    sku: '',
    purchase_unit: '',
    purchase_quantity: 1,
    min_order_quantity: 1,
    lead_time_days: 1,
    is_perishable: false,
    shelf_life_days: 0,
    expiration_date: '',
    lot_number: '',
    notes: ''
  });

  useEffect(() => {
    if (item) {
      setFormData({
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
        notes: item.notes || ''
      });
    } else {
      setFormData({
        item_name: '',
        category: '',
        current_stock: 0,
        unit: 'unidades',
        unit_cost: 0,
        reorder_point: 10,
        par_level: 0,
        max_level: 0,
        supplier_name: '',
        storage_location_id: '',
        preferred_supplier_id: '',
        barcode: '',
        sku: '',
        purchase_unit: '',
        purchase_quantity: 1,
        min_order_quantity: 1,
        lead_time_days: 1,
        is_perishable: false,
        shelf_life_days: 0,
        expiration_date: '',
        lot_number: '',
        notes: ''
      });
    }
  }, [item]);

  const handleSubmit = async () => {
    const data = {
      ...formData,
      storage_location_id: formData.storage_location_id || undefined,
      preferred_supplier_id: formData.preferred_supplier_id || undefined,
      expiration_date: formData.expiration_date || undefined,
      max_level: formData.max_level || undefined,
      shelf_life_days: formData.shelf_life_days || undefined
    };

    if (item) {
      await onUpdate(item.id, data);
    } else {
      await onCreate(data);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {item ? 'Editar Ítem' : 'Nuevo Ítem de Inventario'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Básico</TabsTrigger>
            <TabsTrigger value="stock">Stock</TabsTrigger>
            <TabsTrigger value="supplier">Proveedor</TabsTrigger>
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div>
              <Label>Nombre del Ítem *</Label>
              <Input
                value={formData.item_name}
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                placeholder="Ej: Tomate Cherry"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoría</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ubicación</Label>
                <Select value={formData.storage_location_id} onValueChange={(v) => setFormData({ ...formData, storage_location_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.location_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Unidad</Label>
                <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(u => (
                      <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Costo Unitario ($)</Label>
                <Input
                  type="number"
                  value={formData.unit_cost}
                  onChange={(e) => setFormData({ ...formData, unit_cost: Number(e.target.value) })}
                  min={0}
                  step={0.01}
                />
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
              <Switch
                checked={formData.is_perishable}
                onCheckedChange={(v) => setFormData({ ...formData, is_perishable: v })}
              />
            </div>
          </TabsContent>

          <TabsContent value="stock" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Stock Actual</Label>
                <Input
                  type="number"
                  value={formData.current_stock}
                  onChange={(e) => setFormData({ ...formData, current_stock: Number(e.target.value) })}
                  min={0}
                />
              </div>
              <div>
                <Label>Punto de Reorden</Label>
                <Input
                  type="number"
                  value={formData.reorder_point}
                  onChange={(e) => setFormData({ ...formData, reorder_point: Number(e.target.value) })}
                  min={0}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Par Level (Nivel Óptimo)</Label>
                <Input
                  type="number"
                  value={formData.par_level}
                  onChange={(e) => setFormData({ ...formData, par_level: Number(e.target.value) })}
                  min={0}
                />
              </div>
              <div>
                <Label>Stock Máximo</Label>
                <Input
                  type="number"
                  value={formData.max_level}
                  onChange={(e) => setFormData({ ...formData, max_level: Number(e.target.value) })}
                  min={0}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cantidad Mínima de Orden</Label>
                <Input
                  type="number"
                  value={formData.min_order_quantity}
                  onChange={(e) => setFormData({ ...formData, min_order_quantity: Number(e.target.value) })}
                  min={1}
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
            </div>
            {formData.is_perishable && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vida Útil (días)</Label>
                  <Input
                    type="number"
                    value={formData.shelf_life_days}
                    onChange={(e) => setFormData({ ...formData, shelf_life_days: Number(e.target.value) })}
                    min={1}
                  />
                </div>
                <div>
                  <Label>Fecha de Vencimiento</Label>
                  <Input
                    type="date"
                    value={formData.expiration_date}
                    onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                  />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="supplier" className="space-y-4 mt-4">
            <div>
              <Label>Proveedor Preferido</Label>
              <Select value={formData.preferred_supplier_id} onValueChange={(v) => setFormData({ ...formData, preferred_supplier_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.supplier_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nombre del Proveedor (legado)</Label>
              <Input
                value={formData.supplier_name}
                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                placeholder="Si no está en la lista"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Unidad de Compra</Label>
                <Input
                  value={formData.purchase_unit}
                  onChange={(e) => setFormData({ ...formData, purchase_unit: e.target.value })}
                  placeholder="Ej: Caja, Bolsa"
                />
              </div>
              <div>
                <Label>Unidades por Compra</Label>
                <Input
                  type="number"
                  value={formData.purchase_quantity}
                  onChange={(e) => setFormData({ ...formData, purchase_quantity: Number(e.target.value) })}
                  min={1}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Barcode className="h-4 w-4" />
                  Código de Barras
                </Label>
                <Input
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="1234567890"
                />
              </div>
              <div>
                <Label>SKU</Label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="SKU-001"
                />
              </div>
            </div>
            <div>
              <Label>Número de Lote</Label>
              <Input
                value={formData.lot_number}
                onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
                placeholder="LOT-2024-001"
              />
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales sobre el producto..."
                rows={3}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={!formData.item_name}>
            {item ? 'Guardar Cambios' : 'Crear Ítem'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
