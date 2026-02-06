import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, TrendingDown, FileText, Calendar,
  DollarSign, MinusCircle, PlusCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface PLLineItem {
  label: string;
  amount: number;
  percentage?: number;
  previousAmount?: number;
  isSubtotal?: boolean;
  isTotal?: boolean;
  indent?: number;
}

interface ProfitLossStatementProps {
  periodStart: Date;
  periodEnd: Date;
  totalRevenue: number;
  foodCost: number;
  laborCost: number;
  otherCosts?: number;
  rent?: number;
  utilities?: number;
  marketing?: number;
  previousPeriodData?: {
    totalRevenue: number;
    foodCost: number;
    laborCost: number;
    otherCosts?: number;
  };
}

export const ProfitLossStatement: React.FC<ProfitLossStatementProps> = ({
  periodStart,
  periodEnd,
  totalRevenue,
  foodCost,
  laborCost,
  otherCosts = 0,
  rent = 0,
  utilities = 0,
  marketing = 0,
  previousPeriodData
}) => {
  // Calculate derived values
  const grossProfit = totalRevenue - foodCost;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  
  const totalOperatingExpenses = laborCost + rent + utilities + marketing + otherCosts;
  const operatingProfit = grossProfit - totalOperatingExpenses;
  const operatingMargin = totalRevenue > 0 ? (operatingProfit / totalRevenue) * 100 : 0;
  
  const netProfit = operatingProfit;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Calculate previous period metrics for comparison
  const prevGrossProfit = previousPeriodData 
    ? previousPeriodData.totalRevenue - previousPeriodData.foodCost 
    : 0;
  const prevOperatingProfit = previousPeriodData 
    ? prevGrossProfit - (previousPeriodData.laborCost + (previousPeriodData.otherCosts || 0))
    : 0;

  const VarianceIndicator = ({ current, previous }: { current: number; previous?: number }) => {
    if (!previous || previous === 0) return null;
    const variance = ((current - previous) / Math.abs(previous)) * 100;
    const isPositive = variance >= 0;
    
    return (
      <span className={`text-xs flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
        {isPositive ? '+' : ''}{variance.toFixed(1)}%
      </span>
    );
  };

  const PLRow: React.FC<{ 
    label: string; 
    amount: number; 
    percentage?: number;
    previousAmount?: number;
    isSubtotal?: boolean;
    isTotal?: boolean;
    isExpense?: boolean;
    indent?: number;
  }> = ({ label, amount, percentage, previousAmount, isSubtotal, isTotal, isExpense, indent = 0 }) => (
    <div className={`
      flex items-center justify-between py-2 px-3 rounded
      ${isTotal ? 'bg-primary/10 font-bold text-lg' : ''}
      ${isSubtotal ? 'bg-muted/50 font-semibold' : ''}
      ${!isTotal && !isSubtotal ? 'hover:bg-muted/30' : ''}
    `}>
      <span 
        className={`flex items-center gap-2 ${isExpense ? 'text-muted-foreground' : ''}`}
        style={{ marginLeft: `${indent * 16}px` }}
      >
        {isExpense && <MinusCircle className="h-3 w-3 text-red-400" />}
        {label}
      </span>
      <div className="flex items-center gap-4">
        {percentage !== undefined && (
          <span className="text-sm text-muted-foreground w-16 text-right">
            {percentage.toFixed(1)}%
          </span>
        )}
        <span className={`font-mono w-28 text-right ${amount < 0 ? 'text-red-600' : ''}`}>
          ${Math.abs(amount).toLocaleString()}
        </span>
        <div className="w-20">
          <VarianceIndicator current={amount} previous={previousAmount} />
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Estado de Resultados (P&L)
          </CardTitle>
          <Badge variant="outline" className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(periodStart, 'd MMM', { locale: es })} - {format(periodEnd, 'd MMM yyyy', { locale: es })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* Header Row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b px-3">
          <span>Concepto</span>
          <div className="flex items-center gap-4">
            <span className="w-16 text-right">% Ventas</span>
            <span className="w-28 text-right">Monto</span>
            <span className="w-20 text-right">Var.</span>
          </div>
        </div>

        {/* Revenue Section */}
        <PLRow 
          label="Ingresos por Ventas" 
          amount={totalRevenue} 
          percentage={100}
          previousAmount={previousPeriodData?.totalRevenue}
          isSubtotal
        />

        <Separator className="my-2" />

        {/* Cost of Goods Sold */}
        <p className="text-xs text-muted-foreground px-3 pt-2">COSTO DE VENTAS</p>
        <PLRow 
          label="Costo de Alimentos (Food Cost)" 
          amount={-foodCost}
          percentage={totalRevenue > 0 ? (foodCost / totalRevenue) * 100 : 0}
          previousAmount={previousPeriodData ? -previousPeriodData.foodCost : undefined}
          isExpense
          indent={1}
        />

        <PLRow 
          label="Utilidad Bruta" 
          amount={grossProfit}
          percentage={grossMargin}
          previousAmount={prevGrossProfit}
          isSubtotal
        />

        <Separator className="my-2" />

        {/* Operating Expenses */}
        <p className="text-xs text-muted-foreground px-3 pt-2">GASTOS OPERATIVOS</p>
        <PLRow 
          label="Costo de Personal (Labor Cost)" 
          amount={-laborCost}
          percentage={totalRevenue > 0 ? (laborCost / totalRevenue) * 100 : 0}
          previousAmount={previousPeriodData ? -previousPeriodData.laborCost : undefined}
          isExpense
          indent={1}
        />
        {rent > 0 && (
          <PLRow 
            label="Renta / Alquiler" 
            amount={-rent}
            percentage={totalRevenue > 0 ? (rent / totalRevenue) * 100 : 0}
            isExpense
            indent={1}
          />
        )}
        {utilities > 0 && (
          <PLRow 
            label="Servicios (Luz, Gas, Agua)" 
            amount={-utilities}
            percentage={totalRevenue > 0 ? (utilities / totalRevenue) * 100 : 0}
            isExpense
            indent={1}
          />
        )}
        {marketing > 0 && (
          <PLRow 
            label="Marketing y Publicidad" 
            amount={-marketing}
            percentage={totalRevenue > 0 ? (marketing / totalRevenue) * 100 : 0}
            isExpense
            indent={1}
          />
        )}
        {otherCosts > 0 && (
          <PLRow 
            label="Otros Gastos" 
            amount={-otherCosts}
            percentage={totalRevenue > 0 ? (otherCosts / totalRevenue) * 100 : 0}
            previousAmount={previousPeriodData?.otherCosts ? -previousPeriodData.otherCosts : undefined}
            isExpense
            indent={1}
          />
        )}

        <PLRow 
          label="Utilidad Operativa (EBITDA)" 
          amount={operatingProfit}
          percentage={operatingMargin}
          previousAmount={prevOperatingProfit}
          isSubtotal
        />

        <Separator className="my-2" />

        {/* Net Profit */}
        <PLRow 
          label="UTILIDAD NETA" 
          amount={netProfit}
          percentage={netMargin}
          isTotal
        />

        {/* Summary Metrics */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Margen Bruto</p>
            <p className={`text-2xl font-bold ${grossMargin >= 60 ? 'text-green-600' : 'text-yellow-600'}`}>
              {grossMargin.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Meta: ≥60%</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Margen Operativo</p>
            <p className={`text-2xl font-bold ${operatingMargin >= 15 ? 'text-green-600' : 'text-yellow-600'}`}>
              {operatingMargin.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Meta: ≥15%</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Prime Cost</p>
            <p className={`text-2xl font-bold ${
              totalRevenue > 0 && ((foodCost + laborCost) / totalRevenue) * 100 <= 60 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {totalRevenue > 0 ? (((foodCost + laborCost) / totalRevenue) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Meta: ≤60%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
