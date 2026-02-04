import { useState, useMemo } from 'react';
import { Reservation } from '@/hooks/useReservations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronLeft, ChevronRight, Calendar, Clock, Users, 
  Phone, CheckCircle, XCircle, AlertCircle, MoreHorizontal
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ReservationCalendarViewProps {
  reservations: Reservation[];
  onUpdateStatus: (id: string, status: Reservation['status']) => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-l-amber-500' },
  confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-l-emerald-500' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-l-red-500' },
  completed: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-l-blue-500' },
  no_show: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-l-gray-500' },
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <AlertCircle className="w-3 h-3" />,
  confirmed: <CheckCircle className="w-3 h-3" />,
  cancelled: <XCircle className="w-3 h-3" />,
  completed: <CheckCircle className="w-3 h-3" />,
  no_show: <XCircle className="w-3 h-3" />,
};

export function ReservationCalendarView({ reservations, onUpdateStatus }: ReservationCalendarViewProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const weekDays = useMemo(() => 
    Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart]
  );

  const reservationsByDay = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    
    weekDays.forEach(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayReservations = reservations
        .filter(r => r.reservation_date === dayStr)
        .sort((a, b) => a.reservation_time.localeCompare(b.reservation_time));
      map.set(dayStr, dayReservations);
    });
    
    return map;
  }, [weekDays, reservations]);

  const goToPreviousWeek = () => setCurrentWeekStart(prev => addDays(prev, -7));
  const goToNextWeek = () => setCurrentWeekStart(prev => addDays(prev, 7));
  const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const getTotalGuestsForDay = (dayStr: string) => {
    const dayReservations = reservationsByDay.get(dayStr) || [];
    return dayReservations
      .filter(r => r.status === 'confirmed' || r.status === 'pending')
      .reduce((sum, r) => sum + r.party_size, 0);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={goToNextWeek}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                {format(currentWeekStart, 'MMMM yyyy', { locale: es })}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Semana del {format(currentWeekStart, 'd', { locale: es })} al{' '}
                {format(addDays(currentWeekStart, 6), 'd MMMM', { locale: es })}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday}>
            <Calendar className="w-4 h-4 mr-2" />
            Hoy
          </Button>
        </div>
      </CardHeader>

      <div className="grid grid-cols-7 border-b">
        {weekDays.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayReservations = reservationsByDay.get(dayStr) || [];
          const totalGuests = getTotalGuestsForDay(dayStr);
          const isCurrentDay = isToday(day);
          
          return (
            <div 
              key={dayStr}
              className={cn(
                "p-3 text-center border-r last:border-r-0",
                isCurrentDay && "bg-primary/5"
              )}
            >
              <p className="text-xs font-medium text-muted-foreground uppercase">
                {format(day, 'EEE', { locale: es })}
              </p>
              <p className={cn(
                "text-2xl font-bold mt-1",
                isCurrentDay && "text-primary"
              )}>
                {format(day, 'd')}
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {dayReservations.length} reservas
                </Badge>
              </div>
              {totalGuests > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  <Users className="w-3 h-3 inline mr-1" />
                  {totalGuests} personas
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-7 min-h-[400px]">
        {weekDays.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayReservations = reservationsByDay.get(dayStr) || [];
          const isCurrentDay = isToday(day);
          
          return (
            <div 
              key={dayStr}
              className={cn(
                "border-r last:border-r-0 p-2",
                isCurrentDay && "bg-primary/5"
              )}
            >
              <ScrollArea className="h-[400px]">
                <div className="space-y-2 pr-2">
                  {dayReservations.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Sin reservas
                    </p>
                  ) : (
                    dayReservations.map(reservation => {
                      const colors = STATUS_COLORS[reservation.status];
                      return (
                        <div
                          key={reservation.id}
                          className={cn(
                            "p-2 rounded-lg border-l-4 transition-all hover:shadow-md cursor-pointer",
                            colors.bg,
                            colors.border
                          )}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">
                                {reservation.customer_name}
                              </p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                <span>{reservation.reservation_time.slice(0, 5)}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="w-3 h-3 flex-shrink-0" />
                                <span>{reservation.party_size} pers.</span>
                              </div>
                            </div>
                            <Badge 
                              variant="secondary" 
                              className={cn("text-[10px] px-1 py-0", colors.text)}
                            >
                              {STATUS_ICONS[reservation.status]}
                            </Badge>
                          </div>
                          
                          {/* Quick actions for pending */}
                          {reservation.status === 'pending' && (
                            <div className="flex gap-1 mt-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-xs px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateStatus(reservation.id, 'confirmed');
                                }}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Confirmar
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default ReservationCalendarView;
