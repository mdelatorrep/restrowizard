import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, BarChart3 } from 'lucide-react';
import { BenchmarkComparison } from '@/components/ui/empty-state';

interface KPIs {
  foodCostPercentage: number;
  laborCostPercentage: number;
  grossMargin: number;
  averageTicket: number;
  totalFoodCost: number;
  totalLaborCost: number;
  totalOtherCosts: number;
}

interface Sale {
  sale_date: string;
  total_revenue: number;
}

interface Benchmarks {
  foodCostAvg: number;
  laborCostAvg: number;
  grossMarginAvg: number;
  averageTicketAvg: number;
}

interface Props {
  sales: Sale[];
  kpis: KPIs | null;
  benchmarks: Benchmarks | null;
}

export const FinancesCharts: React.FC<Props> = ({ sales, kpis, benchmarks }) => {
  const last12Sales = sales.slice(0, 12).reverse();
  const profitabilityChart = {
    labels: last12Sales.map(s => new Date(s.sale_date).toLocaleDateString('es', { month: 'short', day: 'numeric' })),
    datasets: [{
      label: 'Ingresos',
      data: last12Sales.map(s => s.total_revenue),
      borderColor: 'hsl(var(--primary))',
      backgroundColor: 'hsl(var(--primary) / 0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  const costBreakdownChart = {
    labels: ['Alimentos', 'Mano de Obra', 'Otros'],
    datasets: [{
      label: 'Costos',
      data: [kpis?.totalFoodCost || 0, kpis?.totalLaborCost || 0, kpis?.totalOtherCosts || 0],
      backgroundColor: ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'],
    }],
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center"><PieChart className="mr-2 text-primary" />Tendencia de Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line data={profitabilityChart} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'top' as const } },
                scales: { y: { title: { display: true, text: 'Ingresos ($)' }, ticks: { callback: (v) => `$${((v as number) / 1000).toFixed(0)}k` } } },
              }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comparación con Industria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {benchmarks && kpis ? (
              <>
                <BenchmarkComparison label="Food Cost" userValue={kpis.foodCostPercentage} benchmarkValue={benchmarks.foodCostAvg} higherIsBetter={false} />
                <BenchmarkComparison label="Labor Cost" userValue={kpis.laborCostPercentage} benchmarkValue={benchmarks.laborCostAvg} higherIsBetter={false} />
                <BenchmarkComparison label="Margen Bruto" userValue={kpis.grossMargin} benchmarkValue={benchmarks.grossMarginAvg} higherIsBetter={true} />
                <BenchmarkComparison label="Ticket Promedio" userValue={kpis.averageTicket} benchmarkValue={benchmarks.averageTicketAvg} unit="" higherIsBetter={true} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Los benchmarks de industria se cargarán pronto</p>
            )}
          </CardContent>
        </Card>
      </div>

      {kpis && (kpis.totalFoodCost > 0 || kpis.totalLaborCost > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><BarChart3 className="mr-2 text-primary" />Desglose de Costos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar data={costBreakdownChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
