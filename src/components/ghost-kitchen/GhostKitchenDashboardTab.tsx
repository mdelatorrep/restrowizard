import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Doughnut } from 'react-chartjs-2';
import { Smartphone } from 'lucide-react';
import type { DisplayBrand } from './ghostKitchenHelpers';
import { pickPalette } from '@/lib/chartColors';

interface Props {
  ordersByPlatform: Record<string, { orders: number; revenue: number; commission: number }>;
  displayBrands: DisplayBrand[];
}

export const GhostKitchenDashboardTab: React.FC<Props> = ({ ordersByPlatform, displayBrands }) => {
  const platformKeys = Object.keys(ordersByPlatform);
  const revenueByPlatform = {
    labels: platformKeys.length > 0
      ? platformKeys.map((p) => p.replace('_', ' ').toUpperCase())
      : ['Sin datos'],
    datasets: [{
      data: platformKeys.length > 0
        ? Object.values(ordersByPlatform).map((p) => p.revenue)
        : [1],
      backgroundColor: pickPalette(Math.max(platformKeys.length, 1)),
      borderWidth: 0,
    }],
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-lg">Ingresos por Plataforma</CardTitle></CardHeader>
          <CardContent className="flex justify-center">
            <div className="w-64 h-64">
              <Doughnut data={revenueByPlatform} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Estado de Marcas</CardTitle></CardHeader>
          <CardContent>
            {displayBrands.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No hay marcas registradas</div>
            ) : (
              <div className="space-y-3">
                {displayBrands.map((brand) => (
                  <div key={brand.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{brand.logo}</span>
                      <div>
                        <p className="font-semibold">{brand.name}</p>
                        <p className="text-sm text-muted-foreground">{brand.cuisine}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${brand.revenue_today.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{brand.orders_today} órdenes</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Rendimiento por Agregador
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(ordersByPlatform).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay datos de agregadores aún. Las órdenes aparecerán aquí.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(ordersByPlatform).map(([platform, data]) => (
                <div key={platform} className="p-4 rounded-lg border bg-card">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold capitalize">{platform.replace('_', ' ')}</span>
                    <Badge variant="outline">{data.orders} órdenes</Badge>
                  </div>
                  <p className="text-2xl font-bold">${data.revenue.toLocaleString()}</p>
                  <p className="text-sm text-destructive">Comisión: -${data.commission.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};
