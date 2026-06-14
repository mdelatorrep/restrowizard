import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/formatCurrency';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAggregatedFinances } from '@/hooks/useAggregatedFinances';
import { useStaffSchedule } from '@/hooks/useStaffSchedule';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, 
  Calculator, Clock, Loader2, Activity, RefreshCw,
  BarChart3, PieChart
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface RealtimeTodayData {
  revenue: number;
  orders: number;
  covers: number;
  avgTicket: number;
}

const MetricCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
  colorClass: string;
}> = ({ icon, title, value, trend, description, colorClass }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div className={`rounded-full p-3 ${colorClass}`}>
          {icon}
        </div>
        {trend && (
          <div className={trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}>
            {trend === 'up' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-bold">{value}</h3>
        <p className="text-sm text-muted-foreground">{title}</p>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
    </CardContent>
  </Card>
);

export const AggregatedFinancesDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  });
  const [realtimeData, setRealtimeData] = useState<RealtimeTodayData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const { 
    dailySales, 
    kpis, 
    trends, 
    loading, 
    hasData, 
    fetchRealtimeToday,
    refetch 
  } = useAggregatedFinances(dateRange);
  
  const { kpis: laborKpis } = useStaffSchedule();

  // Load realtime data
  useEffect(() => {
    const loadRealtime = async () => {
      const data = await fetchRealtimeToday();
      setRealtimeData(data);
    };
    loadRealtime();
    
    // Refresh every 5 minutes
    const interval = setInterval(loadRealtime, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRealtimeToday]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    const data = await fetchRealtimeToday();
    setRealtimeData(data);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Chart data
  const revenueChartData = {
    labels: trends.map(t => format(new Date(t.date), 'dd MMM', { locale: es })),
    datasets: [
      {
        label: 'Ingresos',
        data: trends.map(t => t.revenue),
        borderColor: '#3E1064',
        backgroundColor: 'rgba(62, 16, 100, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Utilidad',
        data: trends.map(t => t.profit),
        borderColor: 'hsl(142 76% 36%)',
        backgroundColor: 'transparent',
        tension: 0.4
      }
    ]
  };

  const costBreakdownData = kpis ? {
    labels: ['Food Cost', 'Labor Cost', 'Utilidad'],
    datasets: [{
      data: [
        kpis.totalFoodCost,
        kpis.totalLaborCost,
        Math.max(0, kpis.netProfit)
      ],
      backgroundColor: [
        'hsl(0 84% 60%)',
        'hsl(45 93% 47%)',
        'hsl(142 76% 36%)'
      ]
    }]
  } : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Finanzas en Tiempo Real</h2>
          <p className="text-muted-foreground">Datos agregados automáticamente desde órdenes y turnos</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Today's Realtime */}
      {realtimeData && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Hoy en Tiempo Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">
                  ${formatCurrency(realtimeData.revenue)}
                </p>
                <p className="text-sm text-muted-foreground">Ingresos</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{realtimeData.orders}</p>
                <p className="text-sm text-muted-foreground">Órdenes</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{realtimeData.covers}</p>
                <p className="text-sm text-muted-foreground">Cubiertos</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{formatCurrency(realtimeData.avgTicket)}</p>
                <p className="text-sm text-muted-foreground">Ticket Promedio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main KPIs */}
      {kpis && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={<DollarSign className="h-6 w-6" />}
            title="Ingresos Totales"
            value={`${formatCurrency(kpis.totalRevenue)}`}
            trend={kpis.totalRevenue > 0 ? 'up' : 'neutral'}
            description={`${kpis.totalOrders} órdenes`}
            colorClass="bg-green-100 text-green-600"
          />
          <MetricCard
            icon={<Calculator className="h-6 w-6" />}
            title="Margen Bruto"
            value={`${kpis.grossMargin.toFixed(1)}%`}
            trend={kpis.grossMargin >= 60 ? 'up' : 'down'}
            description="Ingresos - Food Cost"
            colorClass="bg-blue-100 text-blue-600"
          />
          <MetricCard
            icon={<PieChart className="h-6 w-6" />}
            title="Food Cost"
            value={`${kpis.foodCostPercentage.toFixed(1)}%`}
            trend={kpis.foodCostPercentage <= 30 ? 'up' : 'down'}
            description={`${formatCurrency(kpis.totalFoodCost)}`}
            colorClass="bg-orange-100 text-orange-600"
          />
          <MetricCard
            icon={<Users className="h-6 w-6" />}
            title="Labor Cost"
            value={`${kpis.laborCostPercentage.toFixed(1)}%`}
            trend={kpis.laborCostPercentage <= 25 ? 'up' : 'down'}
            description={`${formatCurrency(kpis.totalLaborCost)}`}
            colorClass="bg-purple-100 text-purple-600"
          />
        </div>
      )}

      {/* Charts */}
      {hasData && (
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Tendencia de Ingresos y Utilidad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Line 
                  data={revenueChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } },
                    scales: {
                      y: { beginAtZero: true }
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {costBreakdownData && (
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Costos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Doughnut 
                    data={costBreakdownData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'bottom' } }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Labor Stats */}
      {laborKpis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Estadísticas de Labor (Esta Semana)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{laborKpis.totalShifts}</p>
                <p className="text-sm text-muted-foreground">Turnos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{laborKpis.totalHoursScheduled.toFixed(0)}h</p>
                <p className="text-sm text-muted-foreground">Horas Programadas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{laborKpis.totalHoursWorked.toFixed(0)}h</p>
                <p className="text-sm text-muted-foreground">Horas Trabajadas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">${formatCurrency(laborKpis.totalLaborCost)}</p>
                <p className="text-sm text-muted-foreground">Costo Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{laborKpis.completionRate.toFixed(0)}%</p>
                <p className="text-sm text-muted-foreground">Tasa Cumplimiento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!hasData && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sin datos de ventas</h3>
            <p className="text-muted-foreground text-center">
              Los datos se calcularán automáticamente desde las órdenes del POS.
              <br />
              Comienza a registrar ventas para ver el análisis financiero.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
