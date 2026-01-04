import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { useToast } from './use-toast';
import { useFinancesData } from './useFinancesData';

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
  const { sales, hasData: hasFinanceData } = useFinancesData();
  const [kpis, setKpis] = useState<OperationsKPIs | null>(null);
  const [benchmarks, setBenchmarks] = useState<OperationsBenchmarks | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  const fetchData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch kitchen production queue for today
      const today = new Date().toISOString().split('T')[0];
      const { data: queueData, error: queueError } = await supabase
        .from('kitchen_production_queue')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      if (queueError) throw queueError;

      // Fetch aggregator orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('aggregator_orders')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const hasQueueData = (queueData?.length || 0) > 0;
      const hasOrdersData = (ordersData?.length || 0) > 0;
      setHasData(hasQueueData || hasOrdersData || hasFinanceData);

      // Calculate KPIs
      const completedOrders = (queueData || []).filter(q => q.status === 'completed').length;
      const pendingQueue = (queueData || []).filter(q => q.status === 'pending' || q.status === 'in_progress').length;

      // Calculate average order time from completed orders
      const completedWithTime = (queueData || []).filter(q => q.completed_at && q.started_at);
      let avgOrderTime = 18; // Default
      if (completedWithTime.length > 0) {
        const totalMinutes = completedWithTime.reduce((sum, q) => {
          const start = new Date(q.started_at!).getTime();
          const end = new Date(q.completed_at!).getTime();
          return sum + (end - start) / 60000;
        }, 0);
        avgOrderTime = totalMinutes / completedWithTime.length;
      }

      // Determine peak hours from orders
      const hourCounts: Record<number, number> = {};
      (ordersData || []).forEach(o => {
        const hour = new Date(o.created_at).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      const sortedHours = Object.entries(hourCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => `${hour}:00`);

      setKpis({
        avgOrderTime: Math.round(avgOrderTime),
        ordersToday: (ordersData?.length || 0) + (queueData?.length || 0),
        peakHours: sortedHours.length > 0 ? sortedHours : ['12:00', '13:00', '20:00'],
        customerSatisfaction: 4.2, // Would come from reviews
        queueLength: pendingQueue,
        completedOrders
      });
    } catch (error: any) {
      console.error('Error fetching operations data:', error);
      toast({
        title: "Error al cargar datos operativos",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBenchmarks = async () => {
    try {
      const { data, error } = await supabase
        .from('industry_benchmarks')
        .select('*')
        .eq('metric_category', 'operations');

      if (error) throw error;

      if (data && data.length > 0) {
        const benchmarkMap: Record<string, number> = {};
        data.forEach(b => {
          benchmarkMap[b.metric_name] = Number(b.avg_value);
        });

        setBenchmarks({
          avgOrderTime: benchmarkMap['avg_order_time_minutes'] || 18,
          customerSatisfaction: benchmarkMap['customer_satisfaction_score'] || 4.2
        });
      }
    } catch (error: any) {
      console.error('Error fetching benchmarks:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchBenchmarks();
  }, [userId, hasFinanceData]);

  return {
    kpis,
    benchmarks,
    loading,
    hasData,
    isViewingClient,
    refetch: fetchData
  };
};
