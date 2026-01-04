import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { useToast } from './use-toast';

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

export const useFinancesData = (dateRange?: { start: Date; end: Date }) => {
  const { userId, isViewingClient } = useDataUserId();
  const { toast } = useToast();
  const [sales, setSales] = useState<DailySale[]>([]);
  const [kpis, setKpis] = useState<FinancesKPIs | null>(null);
  const [benchmarks, setBenchmarks] = useState<FinancesBenchmarks | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  const fetchSales = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('daily_sales')
        .select('*')
        .eq('user_id', userId)
        .order('sale_date', { ascending: false });

      if (dateRange) {
        query = query
          .gte('sale_date', dateRange.start.toISOString().split('T')[0])
          .lte('sale_date', dateRange.end.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;

      setSales(data || []);
      setHasData((data?.length || 0) > 0);

      // Calculate KPIs
      if (data && data.length > 0) {
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

        setKpis({
          totalRevenue,
          totalFoodCost,
          totalLaborCost,
          totalOtherCosts,
          grossMargin,
          foodCostPercentage,
          laborCostPercentage,
          averageTicket,
          totalCovers,
          profitability
        });
      } else {
        setKpis(null);
      }
    } catch (error: any) {
      console.error('Error fetching finances data:', error);
      toast({
        title: "Error al cargar datos financieros",
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
        .eq('metric_category', 'finances');

      if (error) throw error;

      if (data && data.length > 0) {
        const benchmarkMap: Record<string, number> = {};
        data.forEach(b => {
          benchmarkMap[b.metric_name] = Number(b.avg_value);
        });

        setBenchmarks({
          foodCostAvg: benchmarkMap['food_cost_percentage'] || 28.5,
          laborCostAvg: benchmarkMap['labor_cost_percentage'] || 22,
          grossMarginAvg: benchmarkMap['gross_margin'] || 65,
          averageTicketAvg: benchmarkMap['average_ticket'] || 285
        });
      }
    } catch (error: any) {
      console.error('Error fetching benchmarks:', error);
    }
  };

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

      await fetchSales();
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

      await fetchSales();
    } catch (error: any) {
      console.error('Error deleting sale:', error);
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchSales();
    fetchBenchmarks();
  }, [userId, dateRange?.start, dateRange?.end]);

  return {
    sales,
    kpis,
    benchmarks,
    loading,
    hasData,
    isViewingClient,
    addSale,
    deleteSale,
    refetch: fetchSales
  };
};
