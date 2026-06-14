import React, { useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Brain, BarChart3, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAIAgent } from '@/hooks/useAIAgent';
import { useToast } from '@/hooks/use-toast';
import { useOperationsData } from '@/hooks/useOperationsData';
import { useFeedbackData } from '@/hooks/useFeedbackData';
import { useLoyaltyData } from '@/hooks/useLoyaltyData';
import { EmptyState } from '@/components/ui/empty-state';
import { OperationsHeader } from '@/components/operations/OperationsHeader';
import { OperationsKPICards } from '@/components/operations/OperationsKPICards';
import { OperationsInsightsCard } from '@/components/operations/OperationsInsightsCard';
import { LoyaltyDistributionCard } from '@/components/operations/LoyaltyDistributionCard';
import { OperationsSummaryCard } from '@/components/operations/OperationsSummaryCard';

const OperationsAIModule: React.FC = () => {
  const [aiInsights, setAiInsights] = useState<string>('');
  const { loading: aiLoading, analyzeOperations } = useAIAgent();
  const { toast } = useToast();

  const { kpis, benchmarks, hasData: hasOperationsData, loading: operationsLoading } = useOperationsData();
  const { feedback: feedbackData, loading: feedbackLoading } = useFeedbackData();
  const { customers: loyaltyCustomers, loading: loyaltyLoading } = useLoyaltyData();

  const loyaltyStats = {
    totalMembers: loyaltyCustomers?.length || 0,
    vipMembers: loyaltyCustomers?.filter((c) => c.tier_id === 'vip').length || 0,
    regularMembers: loyaltyCustomers?.filter((c) => c.tier_id === 'regular').length || 0,
    occasionalMembers: loyaltyCustomers?.filter((c) => !c.tier_id || c.tier_id === 'basic').length || 0,
  };

  const isLoading = operationsLoading || feedbackLoading || loyaltyLoading;
  const hasAnyData = hasOperationsData || (feedbackData && feedbackData.length > 0) || loyaltyStats.totalMembers > 0;

  const runAIAnalysis = async () => {
    const analysis = await analyzeOperations({
      kpis,
      feedbackCount: feedbackData?.length || 0,
      loyaltyMembers: loyaltyStats.totalMembers,
      avgSatisfaction: kpis?.customerSatisfaction || 4.0,
    });
    if (analysis) {
      setAiInsights(analysis);
      toast({ title: 'Análisis IA completado', description: 'Se han generado nuevos insights de operaciones' });
    }
  };

  const satisfactionData = (feedbackData || []).slice(0, 7).map((f) => f.rating || 0);
  const satisfactionChart = {
    labels: (feedbackData || []).slice(0, 7).map((_, i) => `Sem ${i + 1}`),
    datasets: [{
      label: 'Satisfacción del Cliente',
      data: satisfactionData,
      borderColor: '#3E1064',
      backgroundColor: 'rgba(62, 16, 100, 0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  const customerFlowChart = {
    labels: kpis?.peakHours || [],
    datasets: [{
      label: 'Pedidos por Hora',
      data: kpis?.peakHours?.map(() => kpis?.ordersToday ? Math.ceil(kpis.ordersToday / (kpis.peakHours?.length || 1)) : 0) || [],
      backgroundColor: '#3E1064',
      yAxisID: 'y',
    }],
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!hasAnyData) {
    return (
      <EmptyState
        icon={<BarChart3 className="h-12 w-12" />}
        title="Sin datos de operaciones"
        description="Comienza a registrar ventas, feedback de clientes y datos del programa de lealtad para ver análisis operativos."
      />
    );
  }

  return (
    <div className="space-y-6">
      <OperationsHeader loading={aiLoading} onRunAnalysis={runAIAnalysis} />

      {aiInsights && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <Brain className="mr-2" size={20} />
              Insights IA - Operaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">{aiInsights}</div>
          </CardContent>
        </Card>
      )}

      <OperationsKPICards kpis={kpis} benchmarks={benchmarks} loyaltyTotal={loyaltyStats.totalMembers} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <OperationsInsightsCard kpis={kpis} feedbackCount={feedbackData?.length || 0} />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Flujo de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar
                data={customerFlowChart}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { title: { display: true, text: 'Pedidos' } } },
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LoyaltyDistributionCard loyaltyStats={loyaltyStats} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 text-primary" />
              Evolución de Satisfacción
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line
                data={satisfactionChart}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top' as const } },
                  scales: { y: { title: { display: true, text: 'Satisfacción' }, min: 1, max: 5 } },
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <OperationsSummaryCard
        kpis={kpis}
        loyaltyTotal={loyaltyStats.totalMembers}
        feedbackCount={feedbackData?.length || 0}
      />
    </div>
  );
};

export default OperationsAIModule;
