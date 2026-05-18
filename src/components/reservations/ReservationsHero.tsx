import { Reservation } from '@/hooks/useReservations';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { CreateReservationDialog } from './CreateReservationDialog';
import { ShareReservationsDialog } from './ShareReservationsDialog';

interface Props {
  reservationsCount: number;
  aiLoading: boolean;
  onAnalyzeNoShows: () => void;
  onCreate: (data: any) => Promise<Reservation | null>;
}

export function ReservationsHero({ reservationsCount, aiLoading, onAnalyzeNoShows, onCreate }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-6 text-white">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reservaciones</h1>
          <p className="text-white/80 mt-1">Gestiona las reservas de tu restaurante con IA</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 text-white border-0"
            onClick={onAnalyzeNoShows}
            disabled={aiLoading || reservationsCount === 0}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {aiLoading ? 'Analizando...' : 'Predecir No-Shows'}
          </Button>
          <ShareReservationsDialog />
          <CreateReservationDialog onCreate={onCreate} />
        </div>
      </div>
    </div>
  );
}
