import { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Scan, Camera, Keyboard } from 'lucide-react';

interface Props {
  inputMode: 'manual' | 'camera';
  onInputModeChange: (mode: 'manual' | 'camera') => void;
  barcode: string;
  onBarcodeChange: (value: string) => void;
  onLookup: (code: string) => void;
  isOpen: boolean;
  cameraError: string | null;
  isScanning: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export const BarcodeInputTabs = ({
  inputMode,
  onInputModeChange,
  barcode,
  onBarcodeChange,
  onLookup,
  isOpen,
  cameraError,
  isScanning,
  videoRef,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputMode === 'manual' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, inputMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;
    onLookup(barcode.trim());
  };

  return (
    <Tabs value={inputMode} onValueChange={(v) => onInputModeChange(v as 'manual' | 'camera')}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="manual" className="gap-2">
          <Keyboard className="h-4 w-4" />
          Manual
        </TabsTrigger>
        <TabsTrigger value="camera" className="gap-2">
          <Camera className="h-4 w-4" />
          Cámara
        </TabsTrigger>
      </TabsList>

      <TabsContent value="manual" className="mt-4">
        <form onSubmit={handleSubmit}>
          <Label>Código de Barras / SKU</Label>
          <div className="flex gap-2 mt-1">
            <Input
              ref={inputRef}
              value={barcode}
              onChange={(e) => onBarcodeChange(e.target.value)}
              placeholder="Escanea o ingresa el código..."
              autoFocus
            />
            <Button type="submit" size="sm">
              <Scan className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            El cursor está activo para recibir escaneo de pistola
          </p>
        </form>
      </TabsContent>

      <TabsContent value="camera" className="mt-4">
        {cameraError ? (
          <Card className="border-destructive">
            <CardContent className="py-6 text-center">
              <Camera className="h-12 w-12 mx-auto text-destructive mb-2" />
              <p className="text-sm text-destructive">{cameraError}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => onInputModeChange('manual')}
              >
                Usar entrada manual
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-32 border-2 border-primary rounded-lg opacity-70" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              La lectura automática de códigos requiere una librería adicional.
              Por ahora, usa el modo manual con un escáner de pistola USB.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="O ingresa el código manualmente..."
                value={barcode}
                onChange={(e) => onBarcodeChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onLookup(barcode)}
              />
              <Button onClick={() => onLookup(barcode)} disabled={!barcode}>
                Buscar
              </Button>
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};
