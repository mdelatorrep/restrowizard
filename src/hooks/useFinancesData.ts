import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { useToast } from './use-toast';
import { qk } from '@/lib/queryKeys';

export interface DailySale {
  id: string;
  sale_date: string;
  total_revenue: number;
  covers_count: number | null;
  average_ticket: number | null;
  food_cost: number | null;
  labor_cost: number | null;
  other_costs: number | null;
  notes: string | null;
}

export interface FinancesKPIs {
  totalRevenue: number;
  totalFoodCost: number;
  totalLaborCost: number;
  totalOtherCosts: number;
  grossMargin: number;
  foodCostPercentage: number;
  laborCostPercentage: number;
  averageTicket: number;
  totalCovers: number;
  profitability: number;
}

export interface FinancesBenchmarks {
  foodCostAvg: number;
  laborCostAvg: number;
  grossMarginAvg: number;
  averageTicketAvg: number;
}

const computeKPIs = (data: DailySale[]): FinancesKPIs | null => {
  if (!data || data.length === 0) return null;

  const totalRevenue = data.reduce((sum, s) => sum + Number(s.total_revenue), 0);
  const totalFoodCost = data.reduce((sum, s) => sum + Number(s.food_cost || 0), 0);
  const totalLaborCost = data.reduce((sum, s) => sum + Number(s.labor_cost || 0), 0);
  const totalOtherCosts = data.reduce((sum, s) => sum + Number(s.other_costs || 0), 0);
  const totalCovers = data.reduce((sum, s) => sum + (s.covers_count || 0), 0);

  const grossMargin = totalRevenue > 0
    ? ((totalRevenue - totalFoodCost) / totalRevenue) * 100
    : 0;
  const foodCostPercentage = totalRevenue > 0
    ? (totalFoodCost / totalRevenue) * 100
    : 0;
  const laborCostPercentage = totalRevenue > 0
    ? (totalLaborCost / totalRevenue) * 100
    : 0;
  const averageTicket = totalCovers > 0
    ? totalRevenue / totalCovers
    : 0;
  const profitability = totalRevenue - totalFoodCost - totalLaborCost - totalOtherCosts;

  return {
    totalRevenue,
    totalFoodCost,
    totalLaborCost,
    totalOtherCosts,
    grossMargin,
    foodCostPercentage,
    laborCostPercentage,
    averageTicket,
    totalCovers,
    profitability,
  };
};

export const useFinancesData = (dateRange?: { start: Date; end: Date }) => {
  const { userId, isViewingClient } = useDataUserId();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const rangeKey = dateRange
    ? `${dateRange.start.toISOString().split('T')[0]}_${dateRange.end.toISOString().split('T')[0]}`
    : 'all';

  const { data: sales = [], isLoading: loading } = useQuery({
    queryKey: qk.finances.dailySales(userId, rangeKey),
    enabled: !!userId,
    queryFn: async (): Promise<DailySale[]> => {
      let query = supabase
        .from('daily_sales')
        .select('*')
        .eq('user_id', userId!)
        .order('sale_date', { ascending: false });

      if (dateRange) {
        query = query
          .gte('sale_date', dateRange.start.toISOString().split('T')[0])
          .lte('sale_date', dateRange.end.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as DailySale[];
    },
  });

  const { data: benchmarks = null } = useQuery({
    queryKey: qk.finances.benchmarks(),
    queryFn: async (): Promise<FinancesBenchmarks | null> => {
      const { data, error } = await supabase
        .from('industry_benchmarks')
        .select('*')
        .eq('metric_category', 'finances');
      if (error) throw error;
      if (!data || data.length === 0) return null;
      const benchmarkMap: Record<string, number> = {};
      data.forEach(b => { benchmarkMap[b.metric_name] = Number(b.avg_value); });
      return {
        foodCostAvg: benchmarkMap['food_cost_percentage'] || 28.5,
        laborCostAvg: benchmarkMap['labor_cost_percentage'] || 22,
        grossMarginAvg: benchmarkMap['gross_margin'] || 65,
        averageTicketAvg: benchmarkMap['average_ticket'] || 285,
      };
    },
  });

  const kpis = useMemo(() => computeKPIs(sales), [sales]);
  const hasData = sales.length > 0;

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: qk.finances.dailySales(userId, rangeKey) }),
    [queryClient, userId, rangeKey]
  );

  const addSale = async (sale: Omit<DailySale, 'id'>) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('daily_sales')
        .insert({
          ...sale,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Venta registrada",
        description: "Los datos se han guardado correctamente"
      });

      // Cualquier rango cacheado puede contener esta fecha: invalidar la familia.
      await queryClient.invalidateQueries({ queryKey: ['finances-daily-sales', userId] });
      return data;
    } catch (error: any) {
      console.error('Error adding sale:', error);
      toast({
        title: "Error al guardar",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteSale = async (id: string) => {
    try {
      const { error } = await supabase
        .from('daily_sales')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Registro eliminado"
      });

      await queryClient.invalidateQueries({ queryKey: ['finances-daily-sales', userId] });
    } catch (error: any) {
      console.error('Error deleting sale:', error);
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return {
    sales,
    kpis,
    benchmarks,
    loading,
    hasData,
    isViewingClient,
    addSale,
    deleteSale,
    refetch: invalidate
  };
};
