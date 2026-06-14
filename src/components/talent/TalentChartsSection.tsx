import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Award } from 'lucide-react';
import { CHART_COLORS, pickPalette } from '@/lib/chartColors';

interface Performer {
  id: string;
  name: string;
  position: string;
  performance_score: number;
}

interface Props {
  positionBreakdown: Record<string, number>;
  topPerformers: Performer[];
}

export const TalentChartsSection: React.FC<Props> = ({ positionBreakdown, topPerformers }) => {
  const labels = Object.keys(positionBreakdown || {});
  const positionChart = {
    labels,
    datasets: [{
      label: 'Empleados por Posición',
      data: Object.values(positionBreakdown || {}),
      backgroundColor: pickPalette(labels.length),
      borderColor: CHART_COLORS.primary,
      borderWidth: 1,
    }],
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Calendar className="mr-2 text-primary" />Distribución por Posición</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Bar data={positionChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Award className="mr-2 text-primary" />Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformers.slice(0, 3).map((performer) => (
              <div key={performer.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                    <Award className="text-green-600" size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{performer.name}</h4>
                    <p className="text-xs text-muted-foreground capitalize">{performer.position.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{performer.performance_score}/100</p>
                </div>
              </div>
            ))}
            {(!topPerformers || topPerformers.length === 0) && (
              <p className="text-center text-muted-foreground py-4">No hay suficientes datos para mostrar top performers</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
