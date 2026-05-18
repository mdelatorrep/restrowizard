import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Doughnut } from 'react-chartjs-2';
import type { SustainabilityKPIs, FoodWasteLog } from '@/hooks/useSustainabilityData';
import { buildWasteByCategory } from './sustainabilityCharts';

interface Props {
  kpis: SustainabilityKPIs | null;
  wasteLogs: FoodWasteLog[];
}

export const SustainabilityWasteTab: React.FC<Props> = ({ kpis, wasteLogs }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <Card>
      <CardHeader><CardTitle className="text-lg">Desperdicio por Categoría</CardTitle></CardHeader>
      <CardContent className="flex justify-center">
        {Object.keys(kpis?.wasteByCategory || {}).length > 0 ? (
          <div className="w-64 h-64">
            <Doughnut data={buildWasteByCategory(kpis)} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        ) : (
          <p className="text-muted-foreground py-8">No hay datos de categorías</p>
        )}
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle className="text-lg">Registros Recientes</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {wasteLogs.slice(0, 5).map((log) => (
          <div key={log.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium text-sm">{log.item_name}</p>
              <p className="text-xs text-muted-foreground">{new Date(log.waste_date).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="font-bold">{log.quantity_kg} kg</p>
              {log.estimated_cost && <p className="text-xs text-orange-600">${log.estimated_cost}</p>}
            </div>
          </div>
        ))}
        {wasteLogs.length === 0 && <p className="text-center text-muted-foreground py-4">No hay registros de desperdicio</p>}
      </CardContent>
    </Card>
  </div>
);
