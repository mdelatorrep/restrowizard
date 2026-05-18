import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DailySale {
  date: string;
  total_revenue: number;
  order_count: number;
  food_cost_percentage: number;
  labor_cost_percentage: number;
  gross_margin: number;
}

interface Props {
  dailySales: DailySale[];
}

export const FinancesTrendsTab = ({ dailySales }: Props) => {
  const last14 = dailySales.slice(-14);

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Evolución del Prime Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <Line
                data={{
                  labels: last14.map((d) => format(new Date(d.date), 'd MMM', { locale: es })),
                  datasets: [
                    {
                      label: 'Prime Cost',
                      data: last14.map((d) => d.food_cost_percentage + d.labor_cost_percentage),
                      borderColor: 'hsl(var(--primary))',
                      backgroundColor: 'hsl(var(--primary) / 0.1)',
                      fill: true,
                      tension: 0.4,
                    },
                    {
                      label: 'Objetivo (60%)',
                      data: Array(14).fill(60),
                      borderColor: 'hsl(0 84% 60%)',
                      borderDash: [5, 5],
                      pointRadius: 0,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } },
                  scales: { y: { min: 0, max: 100 } },
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Food Cost vs Labor Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <Line
                data={{
                  labels: last14.map((d) => format(new Date(d.date), 'd MMM', { locale: es })),
                  datasets: [
                    {
                      label: 'Food Cost %',
                      data: last14.map((d) => d.food_cost_percentage),
                      borderColor: 'hsl(25 95% 53%)',
                      tension: 0.4,
                    },
                    {
                      label: 'Labor Cost %',
                      data: last14.map((d) => d.labor_cost_percentage),
                      borderColor: 'hsl(262 83% 58%)',
                      tension: 0.4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } },
                  scales: { y: { min: 0, max: 50 } },
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle por Día</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Fecha</th>
                  <th className="text-right py-3 px-2">Ingresos</th>
                  <th className="text-right py-3 px-2">Órdenes</th>
                  <th className="text-right py-3 px-2">Food Cost</th>
                  <th className="text-right py-3 px-2">Labor Cost</th>
                  <th className="text-right py-3 px-2">Prime Cost</th>
                  <th className="text-right py-3 px-2">Margen</th>
                </tr>
              </thead>
              <tbody>
                {dailySales.slice(-10).reverse().map((day) => {
                  const prime = day.food_cost_percentage + day.labor_cost_percentage;
                  return (
                    <tr key={day.date} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2">
                        {format(new Date(day.date), 'EEE d MMM', { locale: es })}
                      </td>
                      <td className="text-right py-2 px-2 font-medium">
                        ${day.total_revenue.toLocaleString()}
                      </td>
                      <td className="text-right py-2 px-2">{day.order_count}</td>
                      <td className="text-right py-2 px-2">
                        <span className={day.food_cost_percentage > 32 ? 'text-red-600' : ''}>
                          {day.food_cost_percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right py-2 px-2">
                        <span className={day.labor_cost_percentage > 28 ? 'text-red-600' : ''}>
                          {day.labor_cost_percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right py-2 px-2">
                        <Badge variant={prime <= 55 ? 'default' : prime <= 60 ? 'secondary' : 'destructive'}>
                          {prime.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="text-right py-2 px-2">
                        <span className={day.gross_margin >= 60 ? 'text-green-600' : 'text-yellow-600'}>
                          {day.gross_margin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
