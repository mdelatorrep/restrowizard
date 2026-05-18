import { Reservation } from '@/hooks/useReservations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, Phone, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: <AlertCircle className="h-4 w-4" /> },
  confirmed: { label: 'Confirmada', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <CheckCircle className="h-4 w-4" /> },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle className="h-4 w-4" /> },
  completed: { label: 'Completada', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <CheckCircle className="h-4 w-4" /> },
  no_show: { label: 'No asistió', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: <XCircle className="h-4 w-4" /> },
};

interface Props {
  reservation: Reservation;
  onUpdateStatus: (id: string, status: Reservation['status']) => void;
}

export function ReservationCard({ reservation, onUpdateStatus }: Props) {
  const status = STATUS_CONFIG[reservation.status];
  const date = parseISO(reservation.reservation_date);

  const getDateLabel = () => {
    if (isToday(date)) return 'Hoy';
    if (isTomorrow(date)) return 'Mañana';
    return format(date, 'EEEE d MMM', { locale: es });
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden group">
      <div className={`h-1 ${reservation.status === 'confirmed' ? 'bg-emerald-500' : reservation.status === 'pending' ? 'bg-amber-500' : 'bg-gray-300'}`} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg">{reservation.customer_name}</h3>
            <p className="text-sm text-muted-foreground">
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">{reservation.confirmation_code}</span>
            </p>
          </div>
          <Badge className={status.color} variant="outline">
            {status.icon}
            <span className="ml-1">{status.label}</span>
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="capitalize">{getDateLabel()}</span></div>
          <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><span>{reservation.reservation_time.slice(0, 5)}</span></div>
          <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><span>{reservation.party_size} personas</span></div>
          <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span className="truncate">{reservation.customer_phone}</span></div>
        </div>

        {reservation.special_requests && (
          <p className="text-sm bg-muted/50 p-2 rounded mb-4 italic">"{reservation.special_requests}"</p>
        )}

        {reservation.status === 'pending' && (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onUpdateStatus(reservation.id, 'confirmed')} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle className="h-4 w-4 mr-1" />Confirmar
            </Button>
            <Button size="sm" variant="outline" onClick={() => onUpdateStatus(reservation.id, 'cancelled')} className="flex-1 text-red-600 border-red-200 hover:bg-red-50">
              <XCircle className="h-4 w-4 mr-1" />Cancelar
            </Button>
          </div>
        )}

        {reservation.status === 'confirmed' && (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onUpdateStatus(reservation.id, 'completed')} className="flex-1">Marcar completada</Button>
            <Button size="sm" variant="outline" onClick={() => onUpdateStatus(reservation.id, 'no_show')} className="flex-1">No asistió</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
