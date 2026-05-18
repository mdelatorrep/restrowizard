import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Package, Check, X } from 'lucide-react';
import { InventoryItemExtended } from '@/hooks/useEnterpriseInventory';

interface Props {
  item: InventoryItemExtended;
  mode: 'add' | 'remove';
  adjustment: number;
  onModeChange: (mode: 'add' | 'remove') => void;
  onAdjustmentChange: (value: number) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ScannedItemPanel = ({
  item,
  mode,
  adjustment,
  onModeChange,
  onAdjustmentChange,
  onCancel,
  onConfirm,
}: Props) => {
  const newQty = mode === 'add' ? item.current_stock + adjustment : Math.max(0, item.current_stock - adjustment);

  return (
    <Card className="border-primary">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-semibold">{item.item_name}</h4>
            <p className="text-sm text-muted-foreground">
              {item.category} • SKU: {item.sku || item.barcode || '-'}
            </p>
          </div>
          <Badge variant="outline">
            <Package className="h-3 w-3 mr-1" />
            {item.current_stock} {item.unit}
          </Badge>
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === 'add' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => onModeChange('add')}
          >
            <Plus className="h-4 w-4 mr-1" /> Entrada
          </Button>
          <Button
            variant={mode === 'remove' ? 'destructive' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => onModeChange('remove')}
          >
            <Minus className="h-4 w-4 mr-1" /> Salida
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" size="sm" onClick={() => onAdjustmentChange(Math.max(1, adjustment - 1))}>
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            value={adjustment}
            onChange={(e) => onAdjustmentChange(Math.max(1, Number(e.target.value)))}
            className="w-20 text-center"
            min={1}
          />
          <Button variant="outline" size="sm" onClick={() => onAdjustmentChange(adjustment + 1)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-3 bg-muted rounded-lg text-sm mb-4">
          <p>
            <span className="text-muted-foreground">Cantidad actual:</span>{' '}
            <strong>{item.current_stock} {item.unit}</strong>
          </p>
          <p>
            <span className="text-muted-foreground">Nueva cantidad:</span>{' '}
            <strong className={mode === 'add' ? 'text-green-600' : 'text-red-600'}>
              {newQty} {item.unit}
            </strong>
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" /> Cancelar
          </Button>
          <Button className="flex-1" variant={mode === 'add' ? 'default' : 'destructive'} onClick={onConfirm}>
            <Check className="h-4 w-4 mr-1" /> Confirmar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
