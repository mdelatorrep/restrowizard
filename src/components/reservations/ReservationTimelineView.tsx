import { useMemo } from 'react';
import { Reservation } from '@/hooks/useReservations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Clock, Users, Phone, Mail, CheckCircle, XCircle, 
  AlertCircle, MessageSquare, Calendar
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ReservationTimelineViewProps {
  reservations: Reservation[];
  onUpdateStatus: (id: string, status: Reservation['status']) => void;
  date?: Date;
}

const TIME_SLOTS = [
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'
];

const STATUS_CONFIG: Record<string, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: React.ReactNode 
}> = {
  pending: { 
    label: 'Pendiente', 
    color: 'text-amber-700', 
    bgColor: 'bg-amber-100',
    icon: <AlertCircle className="w-4 h-4" /> 
  },
  confirmed: { 
    label: 'Confirmada', 
    color: 'text-emerald-700', 
    bgColor: 'bg-emerald-100',
    icon: <CheckCircle className="w-4 h-4" /> 
  },
  cancelled: { 
    label: 'Cancelada', 
    color: 'text-red-700', 
    bgColor: 'bg-red-100',
    icon: <XCircle className="w-4 h-4" /> 
  },
  completed: { 
    label: 'Completada', 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-100',
    icon: <CheckCircle className="w-4 h-4" /> 
  },
  no_show: { 
    label: 'No asistió', 
    color: 'text-gray-700', 
    bgColor: 'bg-gray-100',
    icon: <XCircle className="w-4 h-4" /> 
  },
};

export function ReservationTimelineView({ 
  reservations, 
  onUpdateStatus,
  date = new Date() 
}: ReservationTimelineViewProps) {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  const reservationsByTime = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    
    TIME_SLOTS.forEach(slot => {
      map.set(slot, []);
    });
    
    reservations
      .filter(r => r.reservation_date === dateStr)
      .forEach(r => {
        const time = r.reservation_time.slice(0, 5);
        const existing = map.get(time) || [];
        existing.push(r);
        map.set(time, existing);
      });
    
    return map;
  }, [reservations, dateStr]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const getDateLabel = () => {
    if (isToday(date)) return 'Hoy';
    if (isTomorrow(date)) return 'Mañana';
    return format(date, 'EEEE d MMMM', { locale: es });
  };

  const totalGuests = reservations
    .filter(r => r.reservation_date === dateStr && (r.status === 'confirmed' || r.status === 'pending'))
    .reduce((sum, r) => sum + r.party_size, 0);

  const confirmedCount = reservations.filter(r => r.reservation_date === dateStr && r.status === 'confirmed').length;
  const pendingCount = reservations.filter(r => r.reservation_date === dateStr && r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Day header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-white flex flex-col items-center justify-center">
            <span className="text-2xl font-bold leading-none">{format(date, 'd')}</span>
            <span className="text-[10px] uppercase">{format(date, 'MMM', { locale: es })}</span>
          </div>
          <div>
            <h3 className="text-xl font-bold capitalize">{getDateLabel()}</h3>
            <p className="text-sm text-muted-foreground">
              {confirmedCount + pendingCount} reservas • {totalGuests} personas esperadas
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            {confirmedCount} confirmadas
          </Badge>
          {pendingCount > 0 && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              <AlertCircle className="w-3 h-3 mr-1" />
              {pendingCount} pendientes
            </Badge>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-[72px] top-0 bottom-0 w-px bg-border" />
        
        <div className="space-y-1">
          {TIME_SLOTS.map(time => {
            const slotReservations = reservationsByTime.get(time) || [];
            const hasReservations = slotReservations.length > 0;
            
            return (
              <div key={time} className="flex gap-4 min-h-[60px]">
                {/* Time label */}
                <div className="w-14 flex-shrink-0 text-right">
                  <span className={cn(
                    "text-sm font-medium",
                    hasReservations ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {time}
                  </span>
                </div>
                
                {/* Timeline dot */}
                <div className="relative flex-shrink-0 w-4">
                  <div className={cn(
                    "absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 bg-background",
                    hasReservations ? "border-primary" : "border-muted"
                  )} />
                </div>
                
                {/* Reservations */}
                <div className="flex-1 pb-4">
                  {slotReservations.length === 0 ? (
                    <div className="h-full" />
                  ) : (
                    <div className="space-y-2">
                      {slotReservations.map(reservation => {
                        const status = STATUS_CONFIG[reservation.status];
                        
                        return (
                          <Card 
                            key={reservation.id} 
                            className={cn(
                              "overflow-hidden transition-all hover:shadow-md",
                              reservation.status === 'cancelled' && "opacity-60"
                            )}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <Avatar className="w-12 h-12 border-2 border-primary/20">
                                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                    {getInitials(reservation.customer_name)}
                                  </AvatarFallback>
                                </Avatar>
                                
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <h4 className="font-semibold text-lg">
                                        {reservation.customer_name}
                                      </h4>
                                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                        <span className="flex items-center gap-1">
                                          <Users className="w-4 h-4" />
                                          {reservation.party_size} personas
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Phone className="w-4 h-4" />
                                          {reservation.customer_phone}
                                        </span>
                                        {reservation.customer_email && (
                                          <span className="flex items-center gap-1">
                                            <Mail className="w-4 h-4" />
                                            {reservation.customer_email}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <Badge className={cn("font-medium", status.bgColor, status.color)}>
                                      {status.icon}
                                      <span className="ml-1">{status.label}</span>
                                    </Badge>
                                  </div>
                                  
                                  {/* Special requests */}
                                  {reservation.special_requests && (
                                    <div className="mt-3 p-3 bg-muted/50 rounded-lg flex items-start gap-2">
                                      <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                      <p className="text-sm text-muted-foreground">
                                        {reservation.special_requests}
                                      </p>
                                    </div>
                                  )}
                                  
                                  {/* Actions */}
                                  <div className="flex items-center gap-2 mt-4">
                                    <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                                      #{reservation.confirmation_code}
                                    </span>
                                    
                                    {reservation.status === 'pending' && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="default"
                                          className="bg-emerald-600 hover:bg-emerald-700"
                                          onClick={() => onUpdateStatus(reservation.id, 'confirmed')}
                                        >
                                          <CheckCircle className="w-4 h-4 mr-1" />
                                          Confirmar
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-red-600 border-red-200 hover:bg-red-50"
                                          onClick={() => onUpdateStatus(reservation.id, 'cancelled')}
                                        >
                                          <XCircle className="w-4 h-4 mr-1" />
                                          Cancelar
                                        </Button>
                                      </>
                                    )}
                                    
                                    {reservation.status === 'confirmed' && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() => onUpdateStatus(reservation.id, 'completed')}
                                        >
                                          <CheckCircle className="w-4 h-4 mr-1" />
                                          Completar
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-gray-600"
                                          onClick={() => onUpdateStatus(reservation.id, 'no_show')}
                                        >
                                          No asistió
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ReservationTimelineView;
