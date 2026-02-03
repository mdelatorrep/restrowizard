import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Scan, Plus, Minus, Package, Check, X } from 'lucide-react';
import { InventoryItemExtended } from '@/hooks/useEnterpriseInventory';

interface Props {
  inventory: InventoryItemExtended[];
  onLookup: (barcode: string) => InventoryItemExtended | undefined;
  onAdjustStock: (itemId: string, newQuantity: number, reason: string) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
}

export const BarcodeScanner = ({ inventory, onLookup, onAdjustStock, isOpen, onClose }: Props) => {
  const [barcode, setBarcode] = useState('');
  const [foundItem, setFoundItem] = useState<InventoryItemExtended | null>(null);
  const [adjustment, setAdjustment] = useState(0);
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;
    
    const item = onLookup(barcode.trim());
    if (item) {
      setFoundItem(item);
      setAdjustment(1);
    } else {
      setFoundItem(null);
    }
  };

  const handleAdjust = async () => {
    if (!foundItem) return;
    
    const newQuantity = mode === 'add' 
      ? foundItem.current_stock + adjustment 
      : Math.max(0, foundItem.current_stock - adjustment);
    
    await onAdjustStock(
      foundItem.id, 
      newQuantity, 
      `Escaneo de código de barras: ${mode === 'add' ? 'Entrada' : 'Salida'}`
    );
    
    // Reset for next scan
    setBarcode('');
    setFoundItem(null);
    setAdjustment(0);
    inputRef.current?.focus();
  };

  const handleReset = () => {
    setBarcode('');
    setFoundItem(null);
    setAdjustment(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5 text-primary" />
            Escaneo de Código de Barras
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Barcode input */}
          <form onSubmit={handleBarcodeSubmit}>
            <Label>Código de Barras / SKU</Label>
            <div className="flex gap-2 mt-1">
              <Input
                ref={inputRef}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Escanea o ingresa el código..."
                autoFocus
              />
              <Button type="submit" size="sm">
                <Scan className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              El cursor está activo para recibir escaneo
            </p>
          </form>

          {/* Found item display */}
          {foundItem && (
            <Card className="border-primary">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold">{foundItem.item_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {foundItem.category} • SKU: {foundItem.sku || foundItem.barcode || '-'}
                    </p>
                  </div>
                  <Badge variant="outline">
                    <Package className="h-3 w-3 mr-1" />
                    {foundItem.current_stock} {foundItem.unit}
                  </Badge>
                </div>

                {/* Mode selector */}
                <div className="flex gap-2 mb-4">
                  <Button 
                    variant={mode === 'add' ? 'default' : 'outline'} 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setMode('add')}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Entrada
                  </Button>
                  <Button 
                    variant={mode === 'remove' ? 'destructive' : 'outline'} 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setMode('remove')}
                  >
                    <Minus className="h-4 w-4 mr-1" /> Salida
                  </Button>
                </div>

                {/* Quantity adjustment */}
                <div className="flex items-center gap-4 mb-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setAdjustment(Math.max(1, adjustment - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={adjustment}
                    onChange={(e) => setAdjustment(Math.max(1, Number(e.target.value)))}
                    className="w-20 text-center"
                    min={1}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setAdjustment(adjustment + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Preview */}
                <div className="p-3 bg-muted rounded-lg text-sm mb-4">
                  <p>
                    <span className="text-muted-foreground">Cantidad actual:</span>{' '}
                    <strong>{foundItem.current_stock} {foundItem.unit}</strong>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Nueva cantidad:</span>{' '}
                    <strong className={mode === 'add' ? 'text-green-600' : 'text-red-600'}>
                      {mode === 'add' 
                        ? foundItem.current_stock + adjustment 
                        : Math.max(0, foundItem.current_stock - adjustment)} {foundItem.unit}
                    </strong>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={handleReset}>
                    <X className="h-4 w-4 mr-1" /> Cancelar
                  </Button>
                  <Button 
                    className="flex-1" 
                    variant={mode === 'add' ? 'default' : 'destructive'}
                    onClick={handleAdjust}
                  >
                    <Check className="h-4 w-4 mr-1" /> Confirmar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Not found message */}
          {barcode && !foundItem && (
            <Card className="border-destructive">
              <CardContent className="py-6 text-center">
                <X className="h-12 w-12 mx-auto text-destructive mb-2" />
                <p className="font-medium">Producto no encontrado</p>
                <p className="text-sm text-muted-foreground">
                  Código: {barcode}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          {!foundItem && !barcode && (
            <div className="text-center py-6 text-muted-foreground">
              <Scan className="h-16 w-16 mx-auto mb-3 opacity-50" />
              <p>Escanea un código de barras o ingresa el SKU</p>
              <p className="text-sm">para buscar y ajustar inventario</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
