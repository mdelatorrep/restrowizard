import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface Row {
  label: string;
  display: string;
  value: number;
}

interface Props {
  rows?: Row[];
}

/**
 * Renders weekly performance against goals.
 * Shows an empty state until real data exists — never mock placeholders
 * (mock $298k/$320k contradicted the dashboard's neutral KPIs).
 */
export const WeeklyPerformanceCard: React.FC<Props> = ({ rows }) => (
  <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
    <CardHeader className="pb-2 sm:pb-4">
      <CardTitle className="font-headline text-base sm:text-lg">Rendimiento Semanal</CardTitle>
      <CardDescription className="font-lato-light text-xs sm:text-sm">
        Comparativa vs semana anterior
      </CardDescription>
    </CardHeader>
    <CardContent>
      {!rows || rows.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          Define tus metas de ventas para ver el avance semanal.
        </div>
      ) : (
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
      )}
    </CardContent>
  </Card>
);
