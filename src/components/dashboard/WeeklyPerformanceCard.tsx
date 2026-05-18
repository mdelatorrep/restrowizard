import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface Row {
  label: string;
  display: string;
  value: number;
}

const DEFAULT_ROWS: Row[] = [
  { label: 'Ventas', display: '$298k / $320k', value: 93 },
  { label: 'Clientes', display: '1.8k / 2k', value: 92 },
  { label: 'Ticket Prom.', display: '$162 / $150', value: 108 },
];

export const WeeklyPerformanceCard: React.FC<{ rows?: Row[] }> = ({ rows = DEFAULT_ROWS }) => (
  <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
    <CardHeader className="pb-2 sm:pb-4">
      <CardTitle className="font-headline text-base sm:text-lg">Rendimiento Semanal</CardTitle>
      <CardDescription className="font-lato-light text-xs sm:text-sm">
        Comparativa vs semana anterior
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-3 sm:space-y-4">
        {rows.map((row) => (
          <div key={row.label} className="space-y-1.5">
            <div className="flex justify-between text-xs sm:text-sm">
              <span>{row.label}</span>
              <span className="font-medium">{row.display}</span>
            </div>
            <Progress value={row.value} className="h-2" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);
