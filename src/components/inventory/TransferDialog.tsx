import { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, MoveHorizontal, Package } from 'lucide-react';
import { InventoryItemExtended, StorageLocation } from '@/hooks/useEnterpriseInventory';
import { useZodForm } from '@/lib/forms';
import { InventoryTransferSchema, type InventoryTransferValues } from '@/lib/schemas/inventoryTransfer';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItemExtended[];
  locations: StorageLocation[];
  onTransfer: (
    itemId: string,
    fromLocationId: string | null,
    toLocationId: string,
    quantity: number,
    notes?: string,
  ) => Promise<void>;
}

const EMPTY: InventoryTransferValues = {
  selectedItemId: '', toLocationId: '', quantity: 1, notes: '',
};

export const TransferDialog = ({ isOpen, onClose, inventory, locations, onTransfer }: Props) => {
  const form = useZodForm<InventoryTransferValues>(InventoryTransferSchema as any, { defaultValues: EMPTY });
  const { register, handleSubmit, control, reset, watch, formState: { errors, isSubmitting } } = form;

  const selectedItemId = watch('selectedItemId');
  const toLocationId = watch('toLocationId');
  const selectedItem = inventory.find(i => i.id === selectedItemId);
  const fromLocation = selectedItem?.storage_location;

  useEffect(() => { if (!isOpen) reset(EMPTY); }, [isOpen, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (selectedItem && values.quantity > selectedItem.current_stock) {
      form.setError('quantity', { message: `Máx. ${selectedItem.current_stock} ${selectedItem.unit}` });
      return;
    }
    await onTransfer(
      values.selectedItemId,
      fromLocation?.id || null,
      values.toLocationId,
      values.quantity,
      values.notes || undefined,
    );
    reset(EMPTY);
    onClose();
  });

  const errMsg = (k: keyof InventoryTransferValues) =>
    errors[k] ? <p className="text-xs text-destructive mt-1">{String(errors[k]?.message)}</p> : null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MoveHorizontal className="h-5 w-5 text-primary" />
            Transferir Inventario
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <Label>Producto</Label>
            <Controller name="selectedItemId" control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger aria-invalid={!!errors.selectedItemId}>
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {(inventory || []).filter(i => i.current_stock > 0).map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        {item.item_name} ({item.current_stock} {item.unit})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
            {errMsg('selectedItemId')}
          </div>

          {selectedItem && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Origen</p>
                <p className="font-medium">{fromLocation?.location_name || 'Sin ubicación'}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Destino</p>
                <p className="font-medium">
                  {locations.find(l => l.id === toLocationId)?.location_name || 'Seleccionar'}
                </p>
              </div>
            </div>
          )}

          <div>
            <Label>Ubicación Destino</Label>
            <Controller name="toLocationId" control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger aria-invalid={!!errors.toLocationId}>
                  <SelectValue placeholder="Seleccionar destino" />
                </SelectTrigger>
                <SelectContent>
                  {(locations || [])
                    .filter(loc => loc.id !== fromLocation?.id && loc.is_active)
                    .map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.location_name}
                        {loc.location_type && ` (${loc.location_type})`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )} />
            {errMsg('toLocationId')}
          </div>

          <div>
            <Label htmlFor="quantity">Cantidad a transferir</Label>
            <Input id="quantity" type="number" min={1} max={selectedItem?.current_stock || undefined}
              aria-invalid={!!errors.quantity} {...register('quantity')} />
            {selectedItem && (
              <p className="text-xs text-muted-foreground mt-1">
                Disponible: {selectedItem.current_stock} {selectedItem.unit}
              </p>
            )}
            {errMsg('quantity')}
          </div>

          <div>
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea id="notes" rows={2}
              placeholder="Razón de la transferencia..." {...register('notes')} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Transfiriendo...' : 'Confirmar Transferencia'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
