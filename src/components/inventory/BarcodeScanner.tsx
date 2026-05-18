import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Scan, X } from 'lucide-react';
import { InventoryItemExtended } from '@/hooks/useEnterpriseInventory';
import { BarcodeScanSchema } from '@/lib/schemas/barcodeScan';
import { toast } from 'sonner';
import { BarcodeInputTabs } from './BarcodeInputTabs';
import { ScannedItemPanel } from './ScannedItemPanel';

interface Props {
  inventory: InventoryItemExtended[];
  onLookup: (barcode: string) => InventoryItemExtended | undefined;
  onAdjustStock: (itemId: string, newQuantity: number, reason: string) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
}

export const BarcodeScanner = ({ onLookup, onAdjustStock, isOpen, onClose }: Props) => {
  const [barcode, setBarcode] = useState('');
  const [foundItem, setFoundItem] = useState<InventoryItemExtended | null>(null);
  const [adjustment, setAdjustment] = useState(0);
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [inputMode, setInputMode] = useState<'manual' | 'camera'>('manual');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  useEffect(() => {
    if (inputMode === 'camera' && isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [inputMode, isOpen]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      setCameraError('No se pudo acceder a la cámara. Verifica los permisos.');
      setInputMode('manual');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const lookupBarcode = (code: string) => {
    const item = onLookup(code);
    setBarcode(code);
    if (item) {
      setFoundItem(item);
      setAdjustment(1);
    } else {
      setFoundItem(null);
    }
  };

  const handleAdjust = async () => {
    if (!foundItem) return;
    const parsed = BarcodeScanSchema.safeParse({ barcode, adjustment, mode });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Datos inválidos');
      return;
    }
    const newQuantity = mode === 'add'
      ? foundItem.current_stock + adjustment
      : Math.max(0, foundItem.current_stock - adjustment);

    await onAdjustStock(
      foundItem.id,
      newQuantity,
      `Escaneo de código de barras: ${mode === 'add' ? 'Entrada' : 'Salida'}`,
    );

    setBarcode('');
    setFoundItem(null);
    setAdjustment(0);
  };

  const handleReset = () => {
    setBarcode('');
    setFoundItem(null);
    setAdjustment(0);
  };

  const handleClose = () => {
    stopCamera();
    handleReset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5 text-primary" />
            Escaneo de Código de Barras
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <BarcodeInputTabs
            inputMode={inputMode}
            onInputModeChange={setInputMode}
            barcode={barcode}
            onBarcodeChange={setBarcode}
            onLookup={lookupBarcode}
            isOpen={isOpen}
            cameraError={cameraError}
            isScanning={isScanning}
            videoRef={videoRef}
          />

          {foundItem && (
            <ScannedItemPanel
              item={foundItem}
              mode={mode}
              adjustment={adjustment}
              onModeChange={setMode}
              onAdjustmentChange={setAdjustment}
              onCancel={handleReset}
              onConfirm={handleAdjust}
            />
          )}

          {barcode && !foundItem && (
            <Card className="border-destructive">
              <CardContent className="py-6 text-center">
                <X className="h-12 w-12 mx-auto text-destructive mb-2" />
                <p className="font-medium">Producto no encontrado</p>
                <p className="text-sm text-muted-foreground">Código: {barcode}</p>
              </CardContent>
            </Card>
          )}

          {!foundItem && !barcode && inputMode === 'manual' && (
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
