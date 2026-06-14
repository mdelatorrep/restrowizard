import React from 'react';
import { formatCurrency } from '@/lib/formatCurrency';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, 
  UtensilsCrossed, Clock, Target, Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DailyFlashReportProps {
  date: Date;
  revenue: number;
  revenueTarget?: number;
  orders: number;
  covers: number;
  avgTicket: number;
  foodCost: number;
  laborCost: number;
  previousDayRevenue?: number;
  previousWeekRevenue?: number;
}

export const DailyFlashReport: React.FC<DailyFlashReportProps> = ({
  date,
  revenue,
  revenueTarget = 0,
  orders,
  covers,
  avgTicket,
  foodCost,
  laborCost,
  previousDayRevenue,
  previousWeekRevenue
}) => {
  const revenueProgress = revenueTarget > 0 ? (revenue / revenueTarget) * 100 : 0;
  const primeCost = revenue > 0 ? ((foodCost + laborCost) / revenue) * 100 : 0;
  const foodCostPercent = revenue > 0 ? (foodCost / revenue) * 100 : 0;
  const laborCostPercent = revenue > 0 ? (laborCost / revenue) * 100 : 0;
  
  const dayOverDayChange = previousDayRevenue && previousDayRevenue > 0 
    ? ((revenue - previousDayRevenue) / previousDayRevenue) * 100 
    : 0;
  
  const weekOverWeekChange = previousWeekRevenue && previousWeekRevenue > 0 
    ? ((revenue - previousWeekRevenue) / previousWeekRevenue) * 100 
    : 0;

  const TrendIndicator = ({ value }: { value: number }) => (
    <span className={`flex items-center text-sm ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
      {value >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
      {value >= 0 ? '+' : ''}{value.toFixed(1)}%
    </span>
  );

  return (
    <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Flash Report
          </CardTitle>
          <Badge variant="outline" className="text-sm font-normal">
            {format(date, "EEEE, d 'de' MMMM", { locale: es })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Revenue */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Ventas del Día</p>
          <p className="text-5xl font-bold text-foreground">
            ${formatCurrency(revenue)}
          </p>
          
          {/* Revenue target progress */}
          {revenueTarget > 0 && (
            <div className="mt-3 max-w-xs mx-auto">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{revenueProgress.toFixed(0)}% de la meta</span>
                <span>${formatCurrency(revenueTarget)}</span>
              </div>
              <Progress 
                value={Math.min(revenueProgress, 100)} 
                className="h-2"
              />
            </div>
          )}
          
          {/* Comparisons */}
          <div className="flex justify-center gap-6 mt-4">
            {previousDayRevenue !== undefined && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">vs Ayer</p>
                <TrendIndicator value={dayOverDayChange} />
              </div>
            )}
            {previousWeekRevenue !== undefined && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">vs Sem. Pasada</p>
                <TrendIndicator value={weekOverWeekChange} />
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-background/50 rounded-lg p-3 text-center">
            <UtensilsCrossed className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-xl font-bold">{orders}</p>
            <p className="text-xs text-muted-foreground">Órdenes</p>
          </div>
          <div className="bg-background/50 rounded-lg p-3 text-center">
            <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-xl font-bold">{covers}</p>
            <p className="text-xs text-muted-foreground">Cubiertos</p>
          </div>
          <div className="bg-background/50 rounded-lg p-3 text-center">
            <DollarSign className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-xl font-bold">${avgTicket.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Ticket Prom.</p>
          </div>
          <div className="bg-background/50 rounded-lg p-3 text-center">
            <Target className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className={`text-xl font-bold ${primeCost > 60 ? 'text-red-600' : 'text-green-600'}`}>
              {primeCost.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Prime Cost</p>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Food Cost</span>
              <span className={`text-sm font-medium ${foodCostPercent > 32 ? 'text-red-600' : ''}`}>
                {foodCostPercent.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={Math.min(foodCostPercent, 50) * 2} 
              className="h-2 bg-orange-100"
            />
            <p className="text-xs text-muted-foreground">${formatCurrency(foodCost)}</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Labor Cost</span>
              <span className={`text-sm font-medium ${laborCostPercent > 30 ? 'text-red-600' : ''}`}>
                {laborCostPercent.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={Math.min(laborCostPercent, 50) * 2} 
              className="h-2 bg-purple-100"
            />
            <p className="text-xs text-muted-foreground">${formatCurrency(laborCost)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
