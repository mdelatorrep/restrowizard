import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, TrendingDown, Target } from 'lucide-react';

interface PrimeCostGaugeProps {
  foodCostPercent: number;
  laborCostPercent: number;
  targetPrimeCost?: number;
}

export const PrimeCostGauge: React.FC<PrimeCostGaugeProps> = ({
  foodCostPercent,
  laborCostPercent,
  targetPrimeCost = 60
}) => {
  const primeCost = foodCostPercent + laborCostPercent;
  const isHealthy = primeCost <= targetPrimeCost;
  const isWarning = primeCost > targetPrimeCost && primeCost <= 65;
  const isCritical = primeCost > 65;
  
  // Calculate the gauge angle (0-180 degrees)
  const maxAngle = 180;
  const normalizedValue = Math.min(primeCost, 80);
  const angle = (normalizedValue / 80) * maxAngle;
  
  const getStatusColor = () => {
    if (isHealthy) return 'text-green-600';
    if (isWarning) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getStatusBg = () => {
    if (isHealthy) return 'bg-green-100';
    if (isWarning) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getStatusLabel = () => {
    if (isHealthy) return 'Saludable';
    if (isWarning) return 'Atención';
    return 'Crítico';
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Prime Cost
          </span>
          <Badge 
            variant="outline" 
            className={`${getStatusBg()} ${getStatusColor()} border-0`}
          >
            {isHealthy ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
            {getStatusLabel()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Gauge visualization */}
        <div className="relative flex flex-col items-center">
          <svg viewBox="0 0 200 120" className="w-48 h-28">
            {/* Background arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="16"
              strokeLinecap="round"
            />
            {/* Green zone (0-55%) */}
            <path
              d="M 20 100 A 80 80 0 0 1 64 34"
              fill="none"
              stroke="hsl(142 76% 36% / 0.3)"
              strokeWidth="16"
              strokeLinecap="round"
            />
            {/* Yellow zone (55-65%) */}
            <path
              d="M 64 34 A 80 80 0 0 1 136 34"
              fill="none"
              stroke="hsl(45 93% 47% / 0.3)"
              strokeWidth="16"
            />
            {/* Red zone (65%+) */}
            <path
              d="M 136 34 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="hsl(0 84% 60% / 0.3)"
              strokeWidth="16"
              strokeLinecap="round"
            />
            {/* Needle */}
            <g transform={`rotate(${angle - 90}, 100, 100)`}>
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="35"
                stroke={isCritical ? 'hsl(0 84% 60%)' : isWarning ? 'hsl(45 93% 47%)' : 'hsl(142 76% 36%)'}
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="100" cy="100" r="8" fill="hsl(var(--foreground))" />
            </g>
          </svg>
          
          {/* Value display */}
          <div className="text-center -mt-2">
            <span className={`text-4xl font-bold ${getStatusColor()}`}>
              {primeCost.toFixed(1)}%
            </span>
            <p className="text-sm text-muted-foreground mt-1">
              Meta: ≤{targetPrimeCost}%
            </p>
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-sm font-medium">Food Cost</span>
            </div>
            <p className={`text-2xl font-bold ${componentColor(foodHealth)}`}>{foodCostPercent.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Target: 28-32%{componentLabel(foodHealth)}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-sm font-medium">Labor Cost</span>
            </div>
            <p className={`text-2xl font-bold ${componentColor(laborHealth)}`}>{laborCostPercent.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Target: 25-30%{componentLabel(laborHealth)}</p>
          </div>
        </div>

        {/* Warning message */}
        {isCritical && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  {foodHealth === 'critical' ? 'Food Cost crítico' : laborHealth === 'critical' ? 'Labor Cost crítico' : 'Prime Cost crítico'}
                </p>
                <p className="text-xs text-red-600">
                  {foodHealth === 'critical' && `Food Cost ${foodCostPercent.toFixed(1)}% supera el máximo recomendado (${FOOD_WARN_MAX}%). `}
                  {laborHealth === 'critical' && `Labor Cost ${laborCostPercent.toFixed(1)}% supera el máximo (${LABOR_WARN_MAX}%). `}
                  {primeHealth === 'critical' && `Prime ${primeCost.toFixed(1)}% > 65%. `}
                  Revisa costos de alimentos y labor para mejorar rentabilidad.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
