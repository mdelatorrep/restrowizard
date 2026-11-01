import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { TrendingUp, BarChart3, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import { useAggregatedFinances } from '@/hooks/useAggregatedFinances';
import { useAIAgent } from '@/hooks/useAIAgent';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

import { PrimeCostGauge } from './PrimeCostGauge';
import { DailyFlashReport } from './DailyFlashReport';
import { addBusinessDays, todayBusinessDay } from '@/lib/businessDay';
import { ProfitLossStatement } from './ProfitLossStatement';
import { CostAlertsPanel, generateCostAlerts } from './CostAlertsPanel';
import { FinancesHeader, type PeriodType } from './FinancesHeader';
import { FinancesTrendsTab } from './FinancesTrendsTab';
import { FinancesOverviewTab } from './FinancesOverviewTab';
import { AIInsightsCard } from './AIInsightsCard';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const AdvancedFinancesDashboard: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>('month');
  const [refreshing, setRefreshing] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>('');
  const { toast } = useToast();

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case 'week':
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'quarter':
        return { start: subDays(now, 90), end: now };
    }
  }, [period]);

  const { dailySales, kpis, trends, loading, hasData, refetch, otherCostsByCategory } = useAggregatedFinances(dateRange);
  // Gastos del período por línea del P&L. Antes el estado de resultados no
  // recibía ningún gasto fijo y la utilidad operativa salía inflada.
  const pnlExpenses = useMemo(() => {
    const byCat = otherCostsByCategory || {};
    const rent = byCat.arriendo || 0;
    const utilities = byCat.servicios_publicos || 0;
    const marketing = byCat.mercadeo || 0;
    const allocated = Object.values(byCat).reduce((s, v) => s + v, 0);
    const total = kpis?.totalOtherCosts || 0;
    return { rent, utilities, marketing, other: Math.max(0, total - rent - utilities - marketing), allocated };
  }, [otherCostsByCategory, kpis?.totalOtherCosts]);
  const { loading: aiLoading, analyzeFinances } = useAIAgent();

  // El flash del día tiene su propia ventana (hoy y los 7 días operativos
  // previos) para no depender del período elegido: el 1.º del mes "Este mes"
  // no contiene a ayer. Compara contra ayer y la semana pasada A ESTA HORA.
  const flashRange = useMemo(() => {
    const end = new Date();
    return { start: subDays(end, 7), end };
  }, []);
  const flash = useAggregatedFinances(flashRange);
  const todayKey = todayBusinessDay();
  const today = flash.dailySales.find((d) => d.date === todayKey);
  const yesterdaySameTime = flash.revenueAtSameTimeByDate[addBusinessDays(todayKey, -1)];
  const lastWeekSameTime = flash.revenueAtSameTimeByDate[addBusinessDays(todayKey, -7)];

  const alerts = kpis
    ? generateCostAlerts({
        foodCostPercent: kpis.foodCostPercentage,
        laborCostPercent: kpis.laborCostPercentage,
        primeCost: kpis.foodCostPercentage + kpis.laborCostPercentage,
        grossMargin: kpis.grossMargin,
      })
    : [];

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    toast({ title: 'Datos actualizados' });
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
      netProfit: kpis.netProfit,
    });
    if (analysis) setAiInsights(analysis);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeAlerts = alerts.filter((a) => a.type === 'critical' || a.type === 'warning').length;

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

      <AIInsightsCard insights={aiInsights} />

      {hasData && (
        <div className="grid lg:grid-cols-2 gap-6">
          <DailyFlashReport
            date={new Date()}
            revenue={today?.total_revenue || 0}
            orders={today?.order_count || 0}
            covers={today?.covers_count || 0}
            avgTicket={today?.avg_ticket || 0}
            foodCost={today?.food_cost || 0}
            laborCost={today?.labor_cost || 0}
            previousDayRevenue={yesterdaySameTime}
            previousWeekRevenue={lastWeekSameTime}
          />
          {kpis && (
            <PrimeCostGauge
              foodCostPercent={kpis.foodCostPercentage}
              laborCostPercent={kpis.laborCostPercentage}
              targetPrimeCost={60}
            />
          )}
        </div>
      )}

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
            {activeAlerts > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center rounded-full">
                {activeAlerts}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <FinancesOverviewTab kpis={kpis} trends={trends} />
        </TabsContent>

        <TabsContent value="pnl">
          {kpis && (
            <ProfitLossStatement
              periodStart={dateRange.start}
              periodEnd={dateRange.end}
              totalRevenue={kpis.totalRevenue}
              taxes={kpis.totalTaxes}
              foodCost={kpis.totalFoodCost}
              laborCost={kpis.totalLaborCost}
              rent={pnlExpenses.rent}
              utilities={pnlExpenses.utilities}
              marketing={pnlExpenses.marketing}
              otherCosts={pnlExpenses.other}
            />

          )}
        </TabsContent>

        <TabsContent value="trends">
          <FinancesTrendsTab dailySales={dailySales} />
        </TabsContent>

        <TabsContent value="alerts">
          <CostAlertsPanel alerts={alerts} />
        </TabsContent>
      </Tabs>

      {!hasData && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sin datos financieros</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Los datos se calcularán automáticamente desde las órdenes del POS,
              costos de inventario y turnos del personal. Comienza a operar para ver el análisis completo.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedFinancesDashboard;
