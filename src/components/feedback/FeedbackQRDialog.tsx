import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Copy, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FeedbackCampaign } from '@/hooks/useFeedbackData';

interface FeedbackQRDialogProps {
  campaign: FeedbackCampaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FeedbackQRDialog: React.FC<FeedbackQRDialogProps> = ({ 
  campaign, 
  open, 
  onOpenChange 
}) => {
  const { toast } = useToast();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const publicUrl = campaign ? `${window.location.origin}/feedback/${campaign.id}` : '';

  useEffect(() => {
    if (open && campaign) {
      generateQRCode();
    }
  }, [open, campaign]);

  const generateQRCode = async () => {
    if (!campaign) return;

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

  const handleDownloadQR = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `qr-feedback-${campaign?.name?.replace(/\s+/g, '-').toLowerCase() || 'campaign'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && qrCodeUrl && campaign) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Code - ${campaign.name}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .container {
              text-align: center;
              padding: 40px;
              border: 2px dashed #ccc;
              border-radius: 16px;
            }
            img {
              width: 300px;
              height: 300px;
            }
            h1 {
              margin: 20px 0 10px;
              font-size: 24px;
              color: #1e293b;
            }
            p {
              color: #64748b;
              margin: 0;
            }
            .incentive {
              margin-top: 16px;
              padding: 12px 24px;
              background: #f0fdf4;
              border-radius: 8px;
              color: #16a34a;
              font-weight: 600;
            }
            @media print {
              .container {
                border: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <img src="${qrCodeUrl}" alt="QR Code" />
            <h1>Déjanos tu opinión</h1>
            <p>Escanea el código QR</p>
            ${campaign.incentive ? `<div class="incentive">🎁 ${campaign.incentive}</div>` : ''}
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  if (!campaign) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code de Feedback</DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 inline-block">
            {loading ? (
              <div className="w-[300px] h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="Código QR de Feedback" 
                className="w-[300px] h-[300px]"
              />
            ) : (
              <div className="w-[300px] h-[300px] flex items-center justify-center text-gray-400">
                Error al generar QR
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">
              {campaign.name}
            </p>
            {campaign.incentive && (
              <p className="text-xs text-green-600 bg-green-50 p-2 rounded">
                🎁 {campaign.incentive}
              </p>
            )}
            <p className="text-xs text-muted-foreground break-all bg-muted p-2 rounded">
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
              size="sm"
              disabled={!qrCodeUrl}
            >
              <Printer className="w-4 h-4 mr-1" />
              Imprimir
            </Button>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <p className="font-medium mb-1">💡 Tip para mesas</p>
            <p>Imprime este QR y colócalo en las mesas o en la cuenta para que tus clientes dejen su opinión fácilmente.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
