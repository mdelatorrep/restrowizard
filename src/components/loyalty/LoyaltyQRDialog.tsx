import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Copy, Printer, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { LoyaltyCustomer } from '@/hooks/useLoyaltyData';

interface LoyaltyQRDialogProps {
  customer: LoyaltyCustomer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LoyaltyQRDialog: React.FC<LoyaltyQRDialogProps> = ({ 
  customer, 
  open, 
  onOpenChange 
}) => {
  const { toast } = useToast();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const publicUrl = customer ? `${window.location.origin}/mi-fidelidad/${customer.loyalty_code}` : '';

  useEffect(() => {
    if (open && customer) {
      generateQRCode();
    }
  }, [open, customer]);

  const generateQRCode = async () => {
    if (!customer?.loyalty_code) return;

    setLoading(true);
    try {
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

  const handleCopyCode = () => {
    if (customer?.loyalty_code) {
      navigator.clipboard.writeText(customer.loyalty_code);
      toast({
        title: 'Copiado',
        description: 'Código de fidelidad copiado',
      });
    }
  };

  const handleDownloadQR = () => {
    if (qrCodeUrl && customer) {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `qr-fidelidad-${customer.customer_name.replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePrint = () => {
    if (!customer || !qrCodeUrl) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Fidelidad - ${customer.customer_name}</title>
          <style>
            body { 
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            .container {
              text-align: center;
              border: 2px solid #e5e7eb;
              border-radius: 16px;
              padding: 32px;
              max-width: 400px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 8px;
              color: #6B46C1;
            }
            .customer-name {
              font-size: 18px;
              color: #374151;
              margin-bottom: 20px;
            }
            .qr-code {
              width: 250px;
              height: 250px;
              margin: 0 auto 20px;
            }
            .code {
              font-family: monospace;
              font-size: 20px;
              font-weight: bold;
              background: #f3f4f6;
              padding: 12px 24px;
              border-radius: 8px;
              display: inline-block;
              margin-bottom: 16px;
            }
            .instructions {
              font-size: 14px;
              color: #6b7280;
            }
            @media print {
              body { padding: 0; }
              .container { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="title">Mi Fidelidad</div>
            <div class="customer-name">${customer.customer_name}</div>
            <img src="${qrCodeUrl}" class="qr-code" alt="QR Code" />
            <div class="code">${customer.loyalty_code}</div>
            <p class="instructions">Escanea este código para ver tus puntos y recompensas</p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR de Fidelidad
          </DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-4">
          <div className="bg-white p-4 rounded-lg border inline-block">
            {loading ? (
              <div className="w-[250px] h-[250px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="Código QR de Fidelidad" 
                className="w-[250px] h-[250px]"
              />
            ) : (
              <div className="w-[250px] h-[250px] flex items-center justify-center text-muted-foreground">
                Error al generar QR
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="font-semibold">{customer.customer_name}</p>
            <div 
              className="inline-block bg-muted px-4 py-2 rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={handleCopyCode}
            >
              <p className="text-xs text-muted-foreground">Código de fidelidad</p>
              <p className="font-mono font-bold text-lg">{customer.loyalty_code}</p>
            </div>
            <p className="text-xs text-muted-foreground break-all bg-muted/50 p-2 rounded">
              {publicUrl}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button 
              onClick={handleCopyUrl}
              variant="outline" 
              size="sm"
            >
              <Copy className="w-4 h-4 mr-1" />
              Copiar
            </Button>
            <Button 
              onClick={handleDownloadQR}
              variant="outline"
              size="sm"
              disabled={!qrCodeUrl}
            >
              <Download className="w-4 h-4 mr-1" />
              Descargar
            </Button>
            <Button 
              onClick={handlePrint}
              variant="outline"
              size="sm"
              disabled={!qrCodeUrl}
            >
              <Printer className="w-4 h-4 mr-1" />
              Imprimir
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            El cliente puede escanear este QR para ver sus puntos, nivel y recompensas
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
