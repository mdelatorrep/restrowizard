import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Package, Calendar, Hash } from 'lucide-react';

export interface ReceivedItem {
  id: string;
  inventory_item_id: string;
  item_name: string;
  quantity_ordered: number;
  quantity_previously_received: number;
  quantity_receiving: number;
  unit: string;
  lot_number: string;
  expiration_date: string;
  is_receiving: boolean;
}

interface Props {
  item: ReceivedItem;
  onUpdate: <K extends keyof ReceivedItem>(field: K, value: ReceivedItem[K]) => void;
}

export const ReceiveOrderItemRow = ({ item, onUpdate }: Props) => {
  return (
    <Card className={item.is_receiving ? 'border-primary/30' : 'opacity-50'}>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={item.is_receiving}
            onCheckedChange={(checked) => onUpdate('is_receiving', !!checked)}
          />
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{item.item_name}</p>
                <p className="text-xs text-muted-foreground">
                  Ordenado: {item.quantity_ordered} {item.unit}
                  {item.quantity_previously_received > 0 && (
                    <span> • Recibido previamente: {item.quantity_previously_received}</span>
                  )}
                </p>
              </div>
              {item.quantity_previously_received > 0 && (
                <Badge variant="secondary">Recepción parcial</Badge>
              )}
            </div>

            {item.is_receiving && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    Cantidad recibida
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={item.quantity_ordered - item.quantity_previously_received}
                    value={item.quantity_receiving}
                    onChange={(e) => onUpdate('quantity_receiving', Number(e.target.value))}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    Número de Lote
                  </Label>
                  <Input
                    placeholder="Ej: LOT-2024-001"
                    value={item.lot_number}
                    onChange={(e) => onUpdate('lot_number', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Fecha Vencimiento
                  </Label>
                  <Input
                    type="date"
                    value={item.expiration_date}
                    onChange={(e) => onUpdate('expiration_date', e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
