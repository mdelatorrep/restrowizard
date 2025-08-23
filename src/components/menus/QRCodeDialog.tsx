import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Copy } from 'lucide-react';
import { useMenus } from '@/hooks/useMenus';
import { useToast } from '@/hooks/use-toast';

interface QRCodeDialogProps {
  menuId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QRCodeDialog: React.FC<QRCodeDialogProps> = ({ menuId, open, onOpenChange }) => {
  const { menus } = useMenus();
  const { toast } = useToast();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const menu = menus.find(m => m.id === menuId);
  const publicUrl = menu ? `${window.location.origin}/menu/${menu.public_url_slug}` : '';

  useEffect(() => {
    if (open && menu) {
      generateQRCode();
    }
  }, [open, menu]);

  const generateQRCode = async () => {
    if (!menu?.public_url_slug) return;

    setLoading(true);
    try {
      // Using a free QR code API
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(publicUrl)}&format=png&color=6B46C1&bgcolor=FFFFFF`;
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: 'Error',
        description: 'No se pudo generar el código QR',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    toast({
      title: 'Copiado',
      description: 'URL copiada al portapapeles',
    });
  };

  const handleDownloadQR = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `qr-${menu?.name?.replace(/\s+/g, '-').toLowerCase() || 'menu'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!menu) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Código QR del Menú</DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 inline-block">
            {loading ? (
              <div className="w-[300px] h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-medium"></div>
              </div>
            ) : qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="Código QR del Menú" 
                className="w-[300px] h-[300px]"
              />
            ) : (
              <div className="w-[300px] h-[300px] flex items-center justify-center text-gray-400">
                Error al generar QR
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-dark">
              {menu.name}
            </p>
            <p className="text-xs text-slate-medium break-all bg-gray-50 p-2 rounded">
              {publicUrl}
            </p>
          </div>

          <div className="flex space-x-2">
            <Button 
              onClick={handleCopyUrl}
              variant="outline" 
              className="flex-1"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar URL
            </Button>
            <Button 
              onClick={handleDownloadQR}
              className="flex-1 bg-purple-intense hover:bg-purple-medium text-off-white"
              disabled={!qrCodeUrl}
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar QR
            </Button>
          </div>

          <div className="text-xs text-slate-medium">
            Los clientes pueden escanear este código QR para acceder directamente a tu menú
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};