import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bar } from 'react-chartjs-2';
import type { SustainabilityKPIs } from '@/hooks/useSustainabilityData';
import { buildCarbonByCategory } from './sustainabilityCharts';

interface Props {
  kpis: SustainabilityKPIs | null;
}

export const SustainabilityCarbonTab: React.FC<Props> = ({ kpis }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <Card>
      <CardHeader><CardTitle className="text-lg">Huella de Carbono por Categoría</CardTitle></CardHeader>
      <CardContent>
        {Object.keys(kpis?.carbonByCategory || {}).length > 0 ? (
          <Bar data={buildCarbonByCategory(kpis)} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No hay datos de huella de carbono. Agrega ítems en la tabla de carbon_footprint_items.
          </p>
        )}
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle className="text-lg">Oportunidades de Reducción</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <p className="font-medium">Cambiar a proveedores locales</p>
            <p className="text-sm text-muted-foreground">Reducción estimada: 15-20% CO2</p>
          </div>
          <Badge className="bg-green-500">Alto impacto</Badge>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <p className="font-medium">Optimizar logística de entregas</p>
            <p className="text-sm text-muted-foreground">Reducción estimada: 5-10% CO2</p>
          </div>
          <Badge variant="secondary">Medio impacto</Badge>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <p className="font-medium">Menú con más opciones plant-based</p>
            <p className="text-sm text-muted-foreground">Reducción estimada: 20-30% CO2</p>
          </div>
          <Badge className="bg-green-500">Alto impacto</Badge>
        </div>
      </CardContent>
    </Card>
  </div>
);
