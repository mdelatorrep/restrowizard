import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import {
  TrendingUp, BarChart3, FileText, AlertTriangle, Loader2, Brain,
} from 'lucide-react';
import { useAggregatedFinances } from '@/hooks/useAggregatedFinances';
import { useStaffSchedule } from '@/hooks/useStaffSchedule';
import { useAIAgent } from '@/hooks/useAIAgent';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

// Components
import { PrimeCostGauge } from './PrimeCostGauge';
import { DailyFlashReport } from './DailyFlashReport';
import { ProfitLossStatement } from './ProfitLossStatement';
import { CostAlertsPanel, generateCostAlerts } from './CostAlertsPanel';
import { FinancesHeader, type PeriodType } from './FinancesHeader';
import { FinancesKPICards } from './FinancesKPICards';
import { FinancesTrendsTab } from './FinancesTrendsTab';

// Register Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const AdvancedFinancesDashboard: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>('month');
  const [refreshing, setRefreshing] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>('');
  const { toast } = useToast();

  // Calculate date range based on period
  const getDateRange = (p: PeriodType) => {
    const now = new Date();
    switch (p) {
      case 'week':
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'quarter':
        return { start: subDays(now, 90), end: now };
    }
  };

  const dateRange = getDateRange(period);
  
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
  const { loading: aiLoading, analyzeFinances } = useAIAgent();

  // Calculate today's data for flash report
  const today = dailySales.find(d => d.date === format(new Date(), 'yyyy-MM-dd'));
  const yesterday = dailySales.find(d => d.date === format(subDays(new Date(), 1), 'yyyy-MM-dd'));
  const lastWeekSameDay = dailySales.find(d => d.date === format(subDays(new Date(), 7), 'yyyy-MM-dd'));

  // Generate cost alerts
  const alerts = kpis ? generateCostAlerts({
    foodCostPercent: kpis.foodCostPercentage,
    laborCostPercent: kpis.laborCostPercentage,
    primeCost: kpis.foodCostPercentage + kpis.laborCostPercentage,
    grossMargin: kpis.grossMargin,
  }) : [];

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    toast({ title: "Datos actualizados" });
  };

  const runAIAnalysis = async () => {
    if (!kpis) return;
    
    const analysis = await analyzeFinances({
      currentProfitability: kpis.grossMargin,
      foodCostPercentage: kpis.foodCostPercentage,
      laborCostPercentage: kpis.laborCostPercentage,
      totalRevenue: kpis.totalRevenue,
      averageTicket: kpis.avgTicket,
      primeCost: kpis.foodCostPercentage + kpis.laborCostPercentage,
      netProfit: kpis.netProfit
    });
    
    if (analysis) {
      setAiInsights(analysis);
    }
  };

  // Chart data
  const revenueVsCostChart = {
    labels: trends.slice(-14).map(t => format(new Date(t.date), 'd MMM', { locale: es })),
    datasets: [
      {
        label: 'Ingresos',
        data: trends.slice(-14).map(t => t.revenue),
        borderColor: 'hsl(142 76% 36%)',
        backgroundColor: 'hsl(142 76% 36% / 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Costo Total',
        data: trends.slice(-14).map(t => t.food_cost + t.labor_cost),
        borderColor: 'hsl(0 84% 60%)',
        backgroundColor: 'transparent',
        tension: 0.4
      }
    ]
  };

  const costBreakdownChart = kpis ? {
    labels: ['Food Cost', 'Labor Cost', 'Utilidad Neta'],
    datasets: [{
      data: [
        kpis.totalFoodCost,
        kpis.totalLaborCost,
        Math.max(0, kpis.netProfit)
      ],
      backgroundColor: [
        'hsl(25 95% 53%)',
        'hsl(262 83% 58%)',
        'hsl(142 76% 36%)'
      ],
      borderWidth: 0
    }]
  } : null;

  const profitTrendChart = {
    labels: trends.slice(-14).map(t => format(new Date(t.date), 'd', { locale: es })),
    datasets: [{
      label: 'Utilidad',
      data: trends.slice(-14).map(t => t.profit),
      backgroundColor: trends.slice(-14).map(t => t.profit >= 0 ? 'hsl(142 76% 36%)' : 'hsl(0 84% 60%)'),
      borderRadius: 4
    }]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FinancesHeader
        period={period}
        onPeriodChange={setPeriod}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        aiLoading={aiLoading}
        onRunAI={runAIAnalysis}
        aiDisabled={!kpis}
      />

      {/* AI Insights */}
      {aiInsights && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-primary text-lg">
              <Brain className="mr-2 h-5 w-5" />
              Análisis Financiero IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
              {aiInsights}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Row: Flash Report + Prime Cost */}
      {hasData && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Daily Flash Report */}
          <DailyFlashReport
            date={new Date()}
            revenue={today?.total_revenue || 0}
            orders={today?.order_count || 0}
            covers={today?.covers_count || 0}
            avgTicket={today?.avg_ticket || 0}
            foodCost={today?.food_cost || 0}
            laborCost={today?.labor_cost || 0}
            previousDayRevenue={yesterday?.total_revenue}
            previousWeekRevenue={lastWeekSameDay?.total_revenue}
          />
          
          {/* Prime Cost Gauge */}
          {kpis && (
            <PrimeCostGauge
              foodCostPercent={kpis.foodCostPercentage}
              laborCostPercent={kpis.laborCostPercentage}
              targetPrimeCost={60}
            />
          )}
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="pnl" className="gap-2">
            <FileText className="h-4 w-4" />
            P&L
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Tendencias
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alertas
            {alerts.filter(a => a.type === 'critical' || a.type === 'warning').length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center rounded-full">
                {alerts.filter(a => a.type === 'critical' || a.type === 'warning').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          {kpis && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="rounded-full p-3 bg-green-100 text-green-600">
                      <DollarSign className="h-6 w-6" />
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold">${kpis.totalRevenue.toLocaleString()}</h3>
                    <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                    <p className="text-xs text-muted-foreground">{kpis.totalOrders} órdenes</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="rounded-full p-3 bg-blue-100 text-blue-600">
                      <Calculator className="h-6 w-6" />
                    </div>
                    {kpis.grossMargin >= 60 
                      ? <ArrowUpRight className="h-5 w-5 text-green-600" />
                      : <ArrowDownRight className="h-5 w-5 text-red-600" />
                    }
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold">{kpis.grossMargin.toFixed(1)}%</h3>
                    <p className="text-sm text-muted-foreground">Margen Bruto</p>
                    <p className="text-xs text-muted-foreground">Meta: ≥60%</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="rounded-full p-3 bg-orange-100 text-orange-600">
                      <PieChart className="h-6 w-6" />
                    </div>
                    {kpis.foodCostPercentage <= 32 
                      ? <ArrowDownRight className="h-5 w-5 text-green-600" />
                      : <ArrowUpRight className="h-5 w-5 text-red-600" />
                    }
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold">{kpis.foodCostPercentage.toFixed(1)}%</h3>
                    <p className="text-sm text-muted-foreground">Food Cost</p>
                    <p className="text-xs text-muted-foreground">${kpis.totalFoodCost.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="rounded-full p-3 bg-purple-100 text-purple-600">
                      <Users className="h-6 w-6" />
                    </div>
                    {kpis.laborCostPercentage <= 28 
                      ? <ArrowDownRight className="h-5 w-5 text-green-600" />
                      : <ArrowUpRight className="h-5 w-5 text-red-600" />
                    }
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold">{kpis.laborCostPercentage.toFixed(1)}%</h3>
                    <p className="text-sm text-muted-foreground">Labor Cost</p>
                    <p className="text-xs text-muted-foreground">${kpis.totalLaborCost.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Charts */}
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Ingresos vs Costos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <Line 
                    data={revenueVsCostChart}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'bottom' } },
                      scales: { y: { beginAtZero: true } }
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {costBreakdownChart && (
              <Card>
                <CardHeader>
                  <CardTitle>Distribución</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <Doughnut 
                      data={costBreakdownChart}
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

          {/* Profit Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Utilidad Diaria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <Bar 
                  data={profitTrendChart}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* P&L Tab */}
        <TabsContent value="pnl">
          {kpis && (
            <ProfitLossStatement
              periodStart={dateRange.start}
              periodEnd={dateRange.end}
              totalRevenue={kpis.totalRevenue}
              foodCost={kpis.totalFoodCost}
              laborCost={kpis.totalLaborCost}
            />
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Evolución del Prime Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <Line 
                    data={{
                      labels: dailySales.slice(-14).map(d => format(new Date(d.date), 'd MMM', { locale: es })),
                      datasets: [
                        {
                          label: 'Prime Cost',
                          data: dailySales.slice(-14).map(d => d.food_cost_percentage + d.labor_cost_percentage),
                          borderColor: 'hsl(var(--primary))',
                          backgroundColor: 'hsl(var(--primary) / 0.1)',
                          fill: true,
                          tension: 0.4
                        },
                        {
                          label: 'Objetivo (60%)',
                          data: Array(14).fill(60),
                          borderColor: 'hsl(0 84% 60%)',
                          borderDash: [5, 5],
                          pointRadius: 0
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'bottom' } },
                      scales: { y: { min: 0, max: 100 } }
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
                      labels: dailySales.slice(-14).map(d => format(new Date(d.date), 'd MMM', { locale: es })),
                      datasets: [
                        {
                          label: 'Food Cost %',
                          data: dailySales.slice(-14).map(d => d.food_cost_percentage),
                          borderColor: 'hsl(25 95% 53%)',
                          tension: 0.4
                        },
                        {
                          label: 'Labor Cost %',
                          data: dailySales.slice(-14).map(d => d.labor_cost_percentage),
                          borderColor: 'hsl(262 83% 58%)',
                          tension: 0.4
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'bottom' } },
                      scales: { y: { min: 0, max: 50 } }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Breakdown Table */}
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
                    {dailySales.slice(-10).reverse().map((day) => (
                      <tr key={day.date} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-2">
                          {format(new Date(day.date), "EEE d MMM", { locale: es })}
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
                          <Badge variant={
                            day.food_cost_percentage + day.labor_cost_percentage <= 55 ? 'default' :
                            day.food_cost_percentage + day.labor_cost_percentage <= 60 ? 'secondary' : 'destructive'
                          }>
                            {(day.food_cost_percentage + day.labor_cost_percentage).toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="text-right py-2 px-2">
                          <span className={day.gross_margin >= 60 ? 'text-green-600' : 'text-yellow-600'}>
                            {day.gross_margin.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <CostAlertsPanel alerts={alerts} />
        </TabsContent>
      </Tabs>

      {/* Empty State */}
      {!hasData && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sin datos financieros</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Los datos se calcularán automáticamente desde las órdenes del POS, 
              costos de inventario y turnos del personal. 
              Comienza a operar para ver el análisis completo.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedFinancesDashboard;
