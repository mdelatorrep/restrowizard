import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, TrendingDown, Users, Calendar, Clock, 
  CheckCircle, XCircle, AlertCircle, Target, Percent
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReservationKPICardsProps {
  kpis: {
    total: number;
    pending: number;
    confirmed: number;
    todayCount: number;
    thisWeekCount: number;
  };
  reservations: Array<{
    status: string;
    party_size: number;
    reservation_date: string;
  }>;
}

export function ReservationKPICards({ kpis, reservations }: ReservationKPICardsProps) {
  // Calculate additional metrics
  const totalGuests = reservations
    .filter(r => r.status === 'confirmed' || r.status === 'pending')
    .reduce((sum, r) => sum + r.party_size, 0);

  const completedCount = reservations.filter(r => r.status === 'completed').length;
  const cancelledCount = reservations.filter(r => r.status === 'cancelled').length;
  const noShowCount = reservations.filter(r => r.status === 'no_show').length;
  
  const confirmationRate = kpis.total > 0 
    ? Math.round(((kpis.confirmed + completedCount) / kpis.total) * 100) 
    : 0;
    
  const noShowRate = kpis.total > 0 
    ? Math.round((noShowCount / kpis.total) * 100) 
    : 0;

  const avgPartySize = reservations.length > 0
    ? (reservations.reduce((sum, r) => sum + r.party_size, 0) / reservations.length).toFixed(1)
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {/* Today */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Hoy</p>
              <p className="text-3xl font-bold mt-1">{kpis.todayCount}</p>
              <p className="text-xs text-muted-foreground mt-1">reservas</p>
            </div>
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full" />
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Pendientes</p>
              <p className="text-3xl font-bold mt-1 text-amber-600">{kpis.pending}</p>
              <p className="text-xs text-muted-foreground mt-1">por confirmar</p>
            </div>
            <div className="p-2 rounded-lg bg-amber-100">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmed */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full" />
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Confirmadas</p>
              <p className="text-3xl font-bold mt-1 text-emerald-600">{kpis.confirmed}</p>
              <p className="text-xs text-muted-foreground mt-1">listas</p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-100">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* This Week */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full" />
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Esta semana</p>
              <p className="text-3xl font-bold mt-1">{kpis.thisWeekCount}</p>
              <p className="text-xs text-muted-foreground mt-1">reservas</p>
            </div>
            <div className="p-2 rounded-lg bg-blue-100">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Guests */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full" />
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Comensales</p>
              <p className="text-3xl font-bold mt-1">{totalGuests}</p>
              <p className="text-xs text-muted-foreground mt-1">ø {avgPartySize} por mesa</p>
            </div>
            <div className="p-2 rounded-lg bg-purple-100">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Rate */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-bl-full" />
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="w-full">
              <p className="text-sm text-muted-foreground font-medium">Tasa confirmación</p>
              <p className="text-3xl font-bold mt-1">{confirmationRate}%</p>
              <Progress value={confirmationRate} className="mt-2 h-1.5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ReservationKPICards;
