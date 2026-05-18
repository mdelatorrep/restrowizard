import { useState } from 'react';
import { useReservations } from '@/hooks/useReservations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAIAgent } from '@/hooks/useAIAgent';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { ReservationKPICards } from '@/components/reservations/ReservationKPICards';
import { ReservationCalendarView } from '@/components/reservations/ReservationCalendarView';
import { ReservationTimelineView } from '@/components/reservations/ReservationTimelineView';
import { ReservationsHero } from '@/components/reservations/ReservationsHero';
import { ReservationsFilterBar, type ViewMode } from '@/components/reservations/ReservationsFilterBar';
import { ReservationsListTabs } from '@/components/reservations/ReservationsListTabs';
import { Loader2 } from 'lucide-react';
import { format, isToday, addDays } from 'date-fns';

export default function ReservationsPage() {
  const { reservations, kpis, loading, updateReservationStatus, createReservation } = useReservations();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [aiInsights, setAiInsights] = useState<string | null>(null);

  const { predictNoShows, loading: aiLoading } = useAIAgent();

  const filteredReservations = reservations.filter(r => {
    const matchesSearch = r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
                          r.customer_phone.includes(search) ||
                          r.confirmation_code.includes(search.toUpperCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayReservations = filteredReservations.filter(r => r.reservation_date === todayStr);
  const upcomingReservations = filteredReservations.filter(r => r.reservation_date >= todayStr);
  const pastReservations = filteredReservations.filter(r => r.reservation_date < todayStr);

  const handleAnalyzeNoShows = async () => {
    const reservationData = {
      reservations: reservations.map(r => ({
        customerName: r.customer_name,
        date: r.reservation_date,
        time: r.reservation_time,
        partySize: r.party_size,
        status: r.status,
        source: r.source,
      })),
      kpis,
      noShowHistory: reservations.filter(r => r.status === 'no_show').length,
      totalReservations: reservations.length,
    };
    const result = await predictNoShows(reservationData);
    if (result) setAiInsights(result);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ReservationsHero
        reservationsCount={reservations.length}
        aiLoading={aiLoading}
        onAnalyzeNoShows={handleAnalyzeNoShows}
        onCreate={createReservation}
      />

      <AIInsightsPanel
        title="Predicción de No-Shows IA"
        description="Identifica reservaciones en riesgo y estrategias de confirmación"
        insights={aiInsights}
        loading={aiLoading}
        onAnalyze={handleAnalyzeNoShows}
      />

      <ReservationKPICards kpis={kpis} reservations={reservations} />

      <ReservationsFilterBar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {viewMode === 'timeline' && (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center gap-2 mb-6">
              <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, -1))}>Anterior</Button>
              <Button variant={isToday(selectedDate) ? 'default' : 'outline'} size="sm" onClick={() => setSelectedDate(new Date())}>Hoy</Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>Siguiente</Button>
            </div>
            <ReservationTimelineView
              reservations={filteredReservations}
              onUpdateStatus={updateReservationStatus}
              date={selectedDate}
            />
          </CardContent>
        </Card>
      )}

      {viewMode === 'calendar' && (
        <ReservationCalendarView
          reservations={filteredReservations}
          onUpdateStatus={updateReservationStatus}
        />
      )}

      {viewMode === 'list' && (
        <ReservationsListTabs
          today={todayReservations}
          upcoming={upcomingReservations}
          past={pastReservations}
          onUpdateStatus={updateReservationStatus}
        />
      )}
    </div>
  );
}
