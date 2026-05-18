import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat } from 'lucide-react';
import { getProductionStatusBadge } from './ghostKitchenHelpers';

interface Props {
  productionQueue: any[];
}

export const GhostKitchenProductionTab: React.FC<Props> = ({ productionQueue }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
        <ChefHat className="h-5 w-5" />
        Cola de Producción
      </CardTitle>
      <CardDescription>Gestiona las órdenes activas de todas las marcas</CardDescription>
    </CardHeader>
    <CardContent>
      {productionQueue.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ChefHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Sin órdenes en cola</p>
          <p className="text-sm">Las órdenes nuevas aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-3">
          {productionQueue.map((order) => (
            <div key={order.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold">#{order.order_id?.slice(-4) || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">{order.brand_id?.slice(0, 6)}</p>
                </div>
                <div>
                  <p className="font-medium">{order.item_name} x{order.quantity || 1}</p>
                  <p className="text-sm text-muted-foreground">Estación: {order.station || 'General'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">{getProductionStatusBadge(order.status || 'pending')}</div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);
