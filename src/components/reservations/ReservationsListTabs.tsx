import { Reservation } from '@/hooks/useReservations';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from 'lucide-react';
import { ReservationCard } from './ReservationCard';

interface Props {
  today: Reservation[];
  upcoming: Reservation[];
  past: Reservation[];
  onUpdateStatus: (id: string, status: Reservation['status']) => void;
}

const Empty = ({ label }: { label: string }) => (
  <Card>
    <CardContent className="py-12 text-center">
      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">{label}</h3>
    </CardContent>
  </Card>
);

const Grid = ({ items, onUpdateStatus }: { items: Reservation[]; onUpdateStatus: Props['onUpdateStatus'] }) => (
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
    {items.map(r => <ReservationCard key={r.id} reservation={r} onUpdateStatus={onUpdateStatus} />)}
  </div>
);

export function ReservationsListTabs({ today, upcoming, past, onUpdateStatus }: Props) {
  return (
    <Tabs defaultValue="today" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="today">Hoy ({today.length})</TabsTrigger>
        <TabsTrigger value="upcoming">Próximas ({upcoming.length})</TabsTrigger>
        <TabsTrigger value="past">Pasadas ({past.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="today">
        {today.length === 0 ? <Empty label="No hay reservas para hoy" /> : <Grid items={today} onUpdateStatus={onUpdateStatus} />}
      </TabsContent>
      <TabsContent value="upcoming">
        {upcoming.length === 0 ? <Empty label="No hay reservas próximas" /> : <Grid items={upcoming} onUpdateStatus={onUpdateStatus} />}
      </TabsContent>
      <TabsContent value="past">
        {past.length === 0 ? <Empty label="No hay reservas pasadas" /> : <Grid items={past} onUpdateStatus={onUpdateStatus} />}
      </TabsContent>
    </Tabs>
  );
}
