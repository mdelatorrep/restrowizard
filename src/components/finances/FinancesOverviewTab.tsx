import React from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FinancesKPICards } from './FinancesKPICards';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  kpis: any;
  trends: any[];
}

export const FinancesOverviewTab: React.FC<Props> = ({ kpis, trends }) => {
  const revenueVsCostChart = {
    labels: trends.slice(-14).map((t) => format(new Date(t.date), 'd MMM', { locale: es })),
    datasets: [
      {
        label: 'Ingresos',
        data: trends.slice(-14).map((t) => t.revenue),
        borderColor: 'hsl(142 76% 36%)',
        backgroundColor: 'hsl(142 76% 36% / 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Costo Total',
        data: trends.slice(-14).map((t) => t.food_cost + t.labor_cost),
        borderColor: 'hsl(0 84% 60%)',
        backgroundColor: 'transparent',
        tension: 0.4,
      },
    ],
  };

  const costBreakdownChart = kpis
    ? {
        labels: ['Food Cost', 'Labor Cost', 'Utilidad Neta'],
        datasets: [
          {
            data: [kpis.totalFoodCost, kpis.totalLaborCost, Math.max(0, kpis.netProfit)],
            backgroundColor: ['hsl(25 95% 53%)', 'hsl(262 83% 58%)', 'hsl(142 76% 36%)'],
            borderWidth: 0,
          },
        ],
      }
    : null;

  const profitTrendChart = {
    labels: trends.slice(-14).map((t) => format(new Date(t.date), 'd', { locale: es })),
    datasets: [
      {
        label: 'Utilidad',
        data: trends.slice(-14).map((t) => t.profit),
        backgroundColor: trends
          .slice(-14)
          .map((t) => (t.profit >= 0 ? 'hsl(142 76% 36%)' : 'hsl(0 84% 60%)')),
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {kpis && <FinancesKPICards kpis={kpis} />}

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ingresos vs Costos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <Line
                data={revenueVsCostChart}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } },
                  scales: { y: { beginAtZero: true } },
                }}
              />
            </div>
          </CardContent>
        </Card>

        {costBreakdownChart && (
          <Card>
            <CardHeader>
              <CardTitle>Distribución</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <Doughnut
                  data={costBreakdownChart}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tendencia de Utilidad Diaria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <Bar
              data={profitTrendChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
