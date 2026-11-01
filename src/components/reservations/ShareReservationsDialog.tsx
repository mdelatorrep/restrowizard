import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Link2, Copy, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useRestaurantWebsite } from '@/hooks/useRestaurantWebsite';

/**
 * Enlace de reservas del restaurante. Antes compartía siempre
 * "/restaurante/mi-restaurante#reservas", un restaurante que no existe: el
 * cliente que lo abría no podía reservar. Ahora usa la página pública de
 * reservas del sitio del restaurante y, si no hay sitio, lleva a crearlo.
 */
export function ShareReservationsDialog() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { website, loading } = useRestaurantWebsite();
  const reservationUrl = website?.slug ? `${window.location.origin}/p/${website.slug}/reservas` : '';

  const copyLink = async () => {
    if (!reservationUrl) return;
    await navigator.clipboard.writeText(reservationUrl);
    toast({ title: 'Enlace copiado', description: 'Compártelo por WhatsApp, Instagram o Google Maps.' });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">
          <Link2 className="h-4 w-4 mr-2" />
          Compartir reservas
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enlace de reservas</DialogTitle>
          <DialogDescription>Tus clientes reservan desde este enlace y la reserva entra directo a tu agenda.</DialogDescription>
        </DialogHeader>
        {loading ? null : reservationUrl ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input value={reservationUrl} readOnly className="flex-1" />
              <Button variant="outline" onClick={copyLink} aria-label="Copiar enlace">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {!website?.is_published && (
              <p className="text-sm text-muted-foreground">
                Tu sitio aún no está publicado: publícalo en <strong>Sitio Web</strong> para que el enlace funcione.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Las reservas en línea viven en el sitio web de tu restaurante. Créalo en un par de minutos y aquí aparecerá tu enlace.
            </p>
            <Button onClick={() => navigate('/r/website')}>
              <Globe className="h-4 w-4 mr-2" /> Crear sitio web
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
