import { Card, CardContent } from '@/components/ui/card';
import { Package, DollarSign, Clock, Timer } from 'lucide-react';

interface Props {
  todayOrdersCount: number;
  todayRevenue: number;
  inProgressCount: number;
  avgDeliveryTime: number;
}

export const DeliveryKPIs = ({ todayOrdersCount, todayRevenue, inProgressCount, avgDeliveryTime }: Props) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Pedidos Hoy</p>
            <p className="text-2xl font-bold">{todayOrdersCount}</p>
          </div>
          <Package className="h-8 w-8 text-primary" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Ventas Hoy</p>
            <p className="text-2xl font-bold">${todayRevenue.toLocaleString()}</p>
          </div>
          <DollarSign className="h-8 w-8 text-green-600" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">En Proceso</p>
            <p className="text-2xl font-bold text-yellow-600">{inProgressCount}</p>
          </div>
          <Clock className="h-8 w-8 text-yellow-600" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Tiempo Promedio</p>
            <p className="text-2xl font-bold">{avgDeliveryTime} min</p>
          </div>
          <Timer className="h-8 w-8 text-blue-600" />
        </div>
      </CardContent>
    </Card>
  </div>
);
