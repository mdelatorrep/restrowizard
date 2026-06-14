import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WasteCategory } from '@/hooks/useSustainabilityData';
import { useEnterpriseInventory } from '@/hooks/useEnterpriseInventory';
import { formatCurrency } from '@/lib/formatCurrency';

export interface WasteLogFormData {
  item_name: string;
  quantity_kg: string;
  category: WasteCategory;
  reason: string;
  preventable: boolean;
  estimated_cost: string;
  inventory_item_id?: string | null;
}

const MANUAL = '__manual__';

export const emptyWasteForm: WasteLogFormData = {
  item_name: '',
  quantity_kg: '',
  category: 'other',
  reason: '',
  preventable: true,
  estimated_cost: '',
  inventory_item_id: null,
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  data: WasteLogFormData;
  onChange: (d: WasteLogFormData) => void;
  onSubmit: () => void;
  trigger?: React.ReactNode;
}

export const WasteLogDialog: React.FC<Props> = ({ open, onOpenChange, data, onChange, onSubmit, trigger }) => {
  const { inventory } = useEnterpriseInventory();

  const handleInventorySelect = (value: string) => {
    if (value === MANUAL) {
      onChange({ ...data, inventory_item_id: null });
      return;
    }
    const item = (inventory || []).find((i) => i.id === value);
    if (!item) return;
    // Pre-rellena nombre + costo estimado a partir del costo unitario × cantidad
    const qty = parseFloat(data.quantity_kg) || 0;
    const cost = qty > 0 ? Math.round(qty * (Number(item.unit_cost) || 0)) : '';
    onChange({
      ...data,
      inventory_item_id: item.id,
      item_name: item.item_name,
      estimated_cost: cost === '' ? data.estimated_cost : String(cost),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Desperdicio</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Vincular con Inventario</Label>
            <Select value={data.inventory_item_id || MANUAL} onValueChange={handleInventorySelect}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un ítem (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={MANUAL}>— Sin vincular (manual) —</SelectItem>
                {(inventory || []).map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.item_name} · {formatCurrency(Number(item.unit_cost) || 0)}/{item.unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Vincular permite calcular la pérdida real con el costo del insumo.
            </p>
          </div>

          <div>
            <Label>Ítem *</Label>
            <Input
              placeholder="Nombre del alimento"
              value={data.item_name}
              onChange={(e) => onChange({ ...data, item_name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cantidad (kg) *</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                placeholder="0.0"
                value={data.quantity_kg}
                onChange={(e) => onChange({ ...data, quantity_kg: e.target.value })}
              />
            </div>
            <div>
              <Label>Costo Estimado</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={data.estimated_cost}
                onChange={(e) => onChange({ ...data, estimated_cost: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Categoría</Label>
            <Select
              value={data.category}
              onValueChange={(v: WasteCategory) => onChange({ ...data, category: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="preparation">Preparación</SelectItem>
                <SelectItem value="overproduction">Sobreproducción</SelectItem>
                <SelectItem value="spoilage">Caducidad</SelectItem>
                <SelectItem value="plate_waste">Plato</SelectItem>
                <SelectItem value="storage">Almacenamiento</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Razón</Label>
            <Input
              placeholder="Descripción opcional"
              value={data.reason}
              onChange={(e) => onChange({ ...data, reason: e.target.value })}
            />
          </div>
          <Button onClick={onSubmit} className="w-full">Guardar Registro</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

