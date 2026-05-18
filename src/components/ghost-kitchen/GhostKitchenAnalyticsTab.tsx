import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar } from 'react-chartjs-2';
import type { DisplayBrand } from './ghostKitchenHelpers';

interface Props {
  displayBrands: DisplayBrand[];
  commissionPaid: number;
  totalRevenue: number;
}

export const GhostKitchenAnalyticsTab: React.FC<Props> = ({ displayBrands, commissionPaid, totalRevenue }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <Card>
      <CardHeader><CardTitle className="text-lg">Rentabilidad por Marca</CardTitle></CardHeader>
      <CardContent>
        <Bar
          data={{
            labels: displayBrands.map((b) => b.name),
            datasets: [{
              label: 'Ingresos',
              data: displayBrands.map((b) => b.revenue_today),
              backgroundColor: 'hsl(var(--primary))',
              borderRadius: 8,
            }],
          }}
          options={{ responsive: true, plugins: { legend: { display: false } } }}
        />
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle className="text-lg">Análisis de Comisiones</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="font-semibold text-destructive">Comisiones pagadas: ${commissionPaid.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {totalRevenue > 0
              ? `Representa el ${Math.round((commissionPaid / totalRevenue) * 100)}% de tus ingresos`
              : 'Sin datos de ingresos'}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <p className="font-semibold text-green-600">Recomendación IA</p>
          <p className="text-sm mt-1">Incrementar pedidos directos puede ahorrarte comisiones significativas</p>
        </div>
      </CardContent>
    </Card>
  </div>
);
