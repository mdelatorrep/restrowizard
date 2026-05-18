import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WasteCategory } from '@/hooks/useSustainabilityData';

export interface WasteLogFormData {
  item_name: string;
  quantity_kg: string;
  category: WasteCategory;
  reason: string;
  preventable: boolean;
  estimated_cost: string;
}

export const emptyWasteForm: WasteLogFormData = {
  item_name: '',
  quantity_kg: '',
  category: 'other',
  reason: '',
  preventable: true,
  estimated_cost: '',
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  data: WasteLogFormData;
  onChange: (d: WasteLogFormData) => void;
  onSubmit: () => void;
  trigger?: React.ReactNode;
}

export const WasteLogDialog: React.FC<Props> = ({ open, onOpenChange, data, onChange, onSubmit, trigger }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Registrar Desperdicio</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
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
              placeholder="0.0"
              value={data.quantity_kg}
              onChange={(e) => onChange({ ...data, quantity_kg: e.target.value })}
            />
          </div>
          <div>
            <Label>Costo Estimado</Label>
            <Input
              type="number"
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
