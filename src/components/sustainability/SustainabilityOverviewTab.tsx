import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Target, CheckCircle } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { BenchmarkComparison } from '@/components/ui/empty-state';
import type { SustainabilityKPIs, FoodWasteLog } from '@/hooks/useSustainabilityData';
import { buildWasteTrend } from './sustainabilityCharts';

interface Props {
  kpis: SustainabilityKPIs | null;
  wasteLogs: FoodWasteLog[];
  benchmarks: { wastePercentage: number; carbonPerCover: number } | null;
}

export const SustainabilityOverviewTab: React.FC<Props> = ({ kpis, wasteLogs, benchmarks }) => {
  const { recent, data: trendData } = buildWasteTrend(wasteLogs);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {recent.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tendencia de Desperdicio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Line data={trendData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }} />
          </CardContent>
        </Card>
      )}
      {benchmarks && kpis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Comparación con Industria
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <BenchmarkComparison
              label="% Desperdicio"
              userValue={(kpis.totalWasteKg / 100) * 10}
              benchmarkValue={benchmarks.wastePercentage}
              higherIsBetter={false}
            />
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
              <h4 className="font-semibold text-green-800 dark:text-green-200 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Recomendación
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {kpis.preventableWastePercentage > 50
                  ? 'Enfócate en reducir desperdicio prevenible - más del 50% era evitable.'
                  : 'Buen trabajo reduciendo desperdicio prevenible. Sigue optimizando.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
