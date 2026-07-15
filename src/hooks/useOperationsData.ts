import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { useToast } from './use-toast';
import { useFinancesData } from './useFinancesData';
import { qk } from '@/lib/queryKeys';

export interface OperationsKPIs {
  avgOrderTime: number;
  ordersToday: number;
  peakHours: string[];
  customerSatisfaction: number;
  queueLength: number;
  completedOrders: number;
}

export interface OperationsBenchmarks {
  avgOrderTime: number;
  customerSatisfaction: number;
}

export const useOperationsData = () => {
  const { userId, isViewingClient } = useDataUserId();
  const { toast } = useToast();
  const { hasData: hasFinanceData } = useFinancesData();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: qk.operations.data(userId),
    enabled: !!userId,
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data: queueData, error: queueError } = await supabase
        .from('kitchen_production_queue')
        .select('*')
        .eq('user_id', userId!)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);
      if (queueError) throw queueError;

      const { data: ordersData, error: ordersError } = await supabase
        .from('aggregator_orders')
        .select('*')
        .eq('user_id', userId!)
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: false });
      if (ordersError) throw ordersError;

      const completedOrders = (queueData || []).filter((q) => q.status === 'completed').length;
      const pendingQueue = (queueData || []).filter((q) => q.status === 'pending' || q.status === 'in_progress').length;

      const completedWithTime = (queueData || []).filter((q: any) => q.completed_at && q.started_at);
      let avgOrderTime = 18;
      if (completedWithTime.length > 0) {
        const totalMinutes = completedWithTime.reduce((sum: number, q: any) => {
          return sum + (new Date(q.completed_at!).getTime() - new Date(q.started_at!).getTime()) / 60000;
        }, 0);
        avgOrderTime = totalMinutes / completedWithTime.length;
      }

      const hourCounts: Record<number, number> = {};
      (ordersData || []).forEach((o: any) => {
        const hour = new Date(o.created_at).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      const sortedHours = Object.entries(hourCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => `${hour}:00`);

      const kpis: OperationsKPIs = {
        avgOrderTime: Math.round(avgOrderTime),
        ordersToday: (ordersData?.length || 0) + (queueData?.length || 0),
        peakHours: sortedHours.length > 0 ? sortedHours : ['12:00', '13:00', '20:00'],
        customerSatisfaction: 4.2,
        queueLength: pendingQueue,
        completedOrders,
      };
      return { kpis, hasOps: (queueData?.length || 0) > 0 || (ordersData?.length || 0) > 0 };
    },
  });

  const { data: benchmarks } = useQuery({
    queryKey: qk.operations.benchmarks(),
    queryFn: async (): Promise<OperationsBenchmarks | null> => {
      const { data, error } = await supabase
        .from('industry_benchmarks')
        .select('*')
        .eq('metric_category', 'operations');
      if (error) throw error;
      if (!data || data.length === 0) return null;
      const map: Record<string, number> = {};
      data.forEach((b: any) => { map[b.metric_name] = Number(b.avg_value); });
      return {
        avgOrderTime: map['avg_order_time_minutes'] || 18,
        customerSatisfaction: map['customer_satisfaction_score'] || 4.2,
      };
    },
  });

  useEffect(() => {
    if (error) {
      console.error('Error fetching operations data:', error);
      toast({ title: 'Error al cargar datos operativos', description: (error as Error).message, variant: 'destructive' });
    }
  }, [error, toast]);

  return {
    kpis: data?.kpis ?? null,
    benchmarks: benchmarks ?? null,
    loading: isLoading,
    hasData: (data?.hasOps ?? false) || hasFinanceData,
    isViewingClient,
    refetch,
  };
};
