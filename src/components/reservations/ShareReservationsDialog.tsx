import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Link2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ShareReservationsDialog() {
  const { toast } = useToast();
  const reservationUrl = `${window.location.origin}/restaurante/mi-restaurante#reservas`;

  const copyLink = () => {
    navigator.clipboard.writeText(reservationUrl);
    toast({ title: 'Enlace copiado', description: 'El enlace de reservas ha sido copiado' });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Link2 className="h-4 w-4 mr-2" />
          Compartir reservas
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compartir sistema de reservas</DialogTitle>
          <DialogDescription>Comparte el enlace de tu sitio web para que los clientes puedan reservar</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input value={reservationUrl} readOnly className="flex-1" />
            <Button variant="outline" onClick={copyLink}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Configura tu sitio web público en <strong>Sitio Web</strong> para habilitar las reservas online
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
