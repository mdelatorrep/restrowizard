import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface KPIData {
  label: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
}

export const DashboardKPIs: React.FC<{ kpis: KPIData[] }> = ({ kpis }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
    {(kpis || []).map((kpi, index) => (
      <Card key={index} className="hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-card to-muted/30">
        <CardContent className="p-3 sm:p-4 md:p-5">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div
              className={`p-1.5 sm:p-2 rounded-lg ${
                kpi.trend === 'up'
                  ? 'bg-success/10 text-success'
                  : kpi.trend === 'down'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {React.cloneElement(kpi.icon as React.ReactElement, {
                className: 'h-4 w-4 sm:h-5 sm:w-5',
              })}
            </div>
            <Badge
              variant={kpi.trend === 'up' ? 'default' : 'destructive'}
              className="gap-0.5 text-[10px] sm:text-xs px-1.5 py-0.5"
            >
              {kpi.trend === 'up' ? (
                <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              ) : (
                <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              )}
              {Math.abs(kpi.change)}%
            </Badge>
          </div>
          <div>
            <p className="text-lg sm:text-xl md:text-2xl font-headline font-bold">{kpi.value}</p>
            <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-lato-light truncate">
              {kpi.label}
            </p>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);
