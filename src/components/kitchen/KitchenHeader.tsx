import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChefHat, Volume2, VolumeX, Maximize2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  currentTime: Date;
  totalActive: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onRefresh: () => void;
  onToggleFullscreen: () => void;
}

export const KitchenHeader = ({
  currentTime,
  totalActive,
  soundEnabled,
  onToggleSound,
  onRefresh,
  onToggleFullscreen,
}: Props) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      <ChefHat className="h-8 w-8 text-primary" />
      <div>
        <h1 className="text-2xl font-bold">Kitchen Display System</h1>
        <p className="text-muted-foreground">
          {format(currentTime, "EEEE, d 'de' MMMM - HH:mm:ss", { locale: es })}
        </p>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-lg px-4 py-2">
        {totalActive} pedidos activos
      </Badge>
      <Button variant="outline" size="icon" onClick={onRefresh}>
        <RefreshCw className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={onToggleSound}>
        {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </Button>
      <Button variant="outline" size="icon" onClick={onToggleFullscreen}>
        <Maximize2 className="h-4 w-4" />
      </Button>
    </div>
  </div>
);
