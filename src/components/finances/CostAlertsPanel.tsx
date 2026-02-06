import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, AlertCircle, TrendingUp, TrendingDown,
  Bell, CheckCircle, XCircle, ArrowRight, Lightbulb
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

export interface CostAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  category: 'food_cost' | 'labor_cost' | 'prime_cost' | 'revenue' | 'margin' | 'anomaly';
  title: string;
  message: string;
  value?: number;
  threshold?: number;
  trend?: 'up' | 'down';
  actionLabel?: string;
  actionUrl?: string;
  createdAt: Date;
  isRead?: boolean;
}

interface CostAlertsPanelProps {
  alerts: CostAlert[];
  onDismiss?: (alertId: string) => void;
  onAction?: (alert: CostAlert) => void;
}

export const CostAlertsPanel: React.FC<CostAlertsPanelProps> = ({
  alerts,
  onDismiss,
  onAction
}) => {
  const getAlertIcon = (type: CostAlert['type']) => {
    switch (type) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
  };

  const getAlertBg = (type: CostAlert['type']) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-900';
      case 'info':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900';
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900';
    }
  };

  const getCategoryLabel = (category: CostAlert['category']) => {
    const labels: Record<CostAlert['category'], string> = {
      food_cost: 'Food Cost',
      labor_cost: 'Labor Cost',
      prime_cost: 'Prime Cost',
      revenue: 'Ingresos',
      margin: 'Margen',
      anomaly: 'Anomalía'
    };
    return labels[category];
  };

  const sortedAlerts = [...alerts].sort((a, b) => {
    const priority = { critical: 0, warning: 1, info: 2, success: 3 };
    return priority[a.type] - priority[b.type];
  });

  const criticalCount = alerts.filter(a => a.type === 'critical').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Alertas de Costos
          </CardTitle>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="rounded-full">
                {criticalCount} críticas
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                {warningCount} advertencias
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sortedAlerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
            <p className="text-lg font-medium text-foreground">Todo en orden</p>
            <p className="text-sm text-muted-foreground">
              No hay alertas de costos en este momento
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${getAlertBg(alert.type)} ${
                  alert.isRead ? 'opacity-75' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(alert.category)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {differenceInDays(new Date(), alert.createdAt) === 0
                          ? 'Hoy'
                          : format(alert.createdAt, "d MMM", { locale: es })}
                      </span>
                    </div>
                    <h4 className="font-semibold text-foreground">{alert.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {alert.message}
                    </p>
                    
                    {/* Value and Threshold Display */}
                    {alert.value !== undefined && (
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-muted-foreground">Actual:</span>
                          <span className={`font-bold ${
                            alert.type === 'critical' ? 'text-red-600' : 
                            alert.type === 'warning' ? 'text-yellow-600' : ''
                          }`}>
                            {alert.value.toFixed(1)}%
                          </span>
                          {alert.trend && (
                            alert.trend === 'up' 
                              ? <TrendingUp className="h-4 w-4 text-red-500" />
                              : <TrendingDown className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        {alert.threshold !== undefined && (
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-muted-foreground">Límite:</span>
                            <span className="font-medium">{alert.threshold}%</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      {alert.actionLabel && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onAction?.(alert)}
                          className="text-xs"
                        >
                          {alert.actionLabel}
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                      {onDismiss && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDismiss(alert.id)}
                          className="text-xs text-muted-foreground"
                        >
                          Descartar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Suggestions */}
        {alerts.some(a => a.type === 'critical' || a.type === 'warning') && (
          <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <h4 className="font-medium text-foreground">Sugerencia IA</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {alerts.some(a => a.category === 'food_cost' && a.type === 'critical')
                    ? 'Tu Food Cost está elevado. Considera revisar precios con proveedores, reducir desperdicio, o ajustar porciones en recetas con menor rentabilidad.'
                    : alerts.some(a => a.category === 'labor_cost' && a.type === 'critical')
                    ? 'El costo de labor supera los límites. Optimiza los turnos según el flujo de clientes y considera cross-training del personal.'
                    : 'Revisa las alertas activas y toma acciones correctivas para mejorar la rentabilidad de tu operación.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper to generate alerts from financial data
export const generateCostAlerts = (data: {
  foodCostPercent: number;
  laborCostPercent: number;
  primeCost: number;
  grossMargin: number;
  revenueChange?: number;
  previousFoodCost?: number;
  previousLaborCost?: number;
}): CostAlert[] => {
  const alerts: CostAlert[] = [];
  const now = new Date();

  // Food Cost Alerts
  if (data.foodCostPercent > 35) {
    alerts.push({
      id: 'fc-critical',
      type: 'critical',
      category: 'food_cost',
      title: 'Food Cost Crítico',
      message: 'El costo de alimentos supera el 35% de las ventas. Esto afecta severamente tu rentabilidad.',
      value: data.foodCostPercent,
      threshold: 32,
      trend: data.previousFoodCost && data.foodCostPercent > data.previousFoodCost ? 'up' : 'down',
      actionLabel: 'Ver Inventario',
      actionUrl: '/r/inventory',
      createdAt: now
    });
  } else if (data.foodCostPercent > 32) {
    alerts.push({
      id: 'fc-warning',
      type: 'warning',
      category: 'food_cost',
      title: 'Food Cost Elevado',
      message: 'El costo de alimentos está por encima del objetivo. Considera revisar recetas y proveedores.',
      value: data.foodCostPercent,
      threshold: 32,
      actionLabel: 'Ver Recetas',
      actionUrl: '/r/recipes',
      createdAt: now
    });
  }

  // Labor Cost Alerts
  if (data.laborCostPercent > 32) {
    alerts.push({
      id: 'lc-critical',
      type: 'critical',
      category: 'labor_cost',
      title: 'Labor Cost Crítico',
      message: 'El costo de personal supera el 32% de las ventas. Revisa la programación de turnos.',
      value: data.laborCostPercent,
      threshold: 30,
      trend: data.previousLaborCost && data.laborCostPercent > data.previousLaborCost ? 'up' : 'down',
      actionLabel: 'Ver Turnos',
      actionUrl: '/r/talent',
      createdAt: now
    });
  } else if (data.laborCostPercent > 28) {
    alerts.push({
      id: 'lc-warning',
      type: 'warning',
      category: 'labor_cost',
      title: 'Labor Cost Elevado',
      message: 'El costo de personal está cerca del límite. Optimiza los horarios según demanda.',
      value: data.laborCostPercent,
      threshold: 28,
      createdAt: now
    });
  }

  // Prime Cost Alert
  if (data.primeCost > 65) {
    alerts.push({
      id: 'pc-critical',
      type: 'critical',
      category: 'prime_cost',
      title: 'Prime Cost Fuera de Control',
      message: 'La suma de Food Cost y Labor Cost supera el 65%. Tu margen de operación está en riesgo.',
      value: data.primeCost,
      threshold: 60,
      createdAt: now
    });
  }

  // Margin Alert
  if (data.grossMargin < 55) {
    alerts.push({
      id: 'gm-warning',
      type: 'warning',
      category: 'margin',
      title: 'Margen Bruto Bajo',
      message: 'Tu margen bruto está por debajo del estándar de la industria (60%). Revisa precios de venta.',
      value: data.grossMargin,
      threshold: 60,
      actionLabel: 'Ver Menú',
      actionUrl: '/r/menu-engineering',
      createdAt: now
    });
  }

  // Revenue Change Alert
  if (data.revenueChange !== undefined && data.revenueChange < -15) {
    alerts.push({
      id: 'rev-warning',
      type: 'warning',
      category: 'revenue',
      title: 'Caída en Ventas',
      message: `Las ventas han caído un ${Math.abs(data.revenueChange).toFixed(1)}% respecto al período anterior.`,
      value: data.revenueChange,
      trend: 'down',
      createdAt: now
    });
  }

  // Success alert when everything is good
  if (alerts.length === 0 && data.primeCost <= 55 && data.grossMargin >= 65) {
    alerts.push({
      id: 'success',
      type: 'success',
      category: 'prime_cost',
      title: 'Excelente Control de Costos',
      message: 'Tus métricas financieras están por encima de los estándares de la industria. ¡Sigue así!',
      createdAt: now
    });
  }

  return alerts;
};
