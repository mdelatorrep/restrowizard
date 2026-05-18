import { Card, CardContent } from '@/components/ui/card';
import { Clock, PlayCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  pending: number;
  preparing: number;
  ready: number;
}

export const KitchenStatsBar = ({ pending, preparing, ready }: Props) => (
  <div className="grid grid-cols-3 gap-4 mb-6">
    <Card className="bg-yellow-500/10 border-yellow-500/20">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-yellow-600">Pendientes</p>
          <p className="text-3xl font-bold text-yellow-600">{pending}</p>
        </div>
        <Clock className="h-10 w-10 text-yellow-500" />
      </CardContent>
    </Card>

    <Card className="bg-blue-500/10 border-blue-500/20">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-blue-600">Preparando</p>
          <p className="text-3xl font-bold text-blue-600">{preparing}</p>
        </div>
        <PlayCircle className="h-10 w-10 text-blue-500" />
      </CardContent>
    </Card>

    <Card className="bg-green-500/10 border-green-500/20">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-green-600">Listos</p>
          <p className="text-3xl font-bold text-green-600">{ready}</p>
        </div>
        <CheckCircle2 className="h-10 w-10 text-green-500" />
      </CardContent>
    </Card>
  </div>
);
