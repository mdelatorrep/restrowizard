import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { useToast } from './use-toast';
import { format, subDays, eachDayOfInterval } from 'date-fns';

export interface AggregatedDailySales {
  date: string;
  total_revenue: number;
  order_count: number;
  covers_count: number;
  food_cost: number;
  labor_cost: number;
  avg_ticket: number;
  gross_margin: number;
  food_cost_percentage: number;
  labor_cost_percentage: number;
}

export interface AggregatedFinancesKPIs {
  totalRevenue: number;
  totalFoodCost: number;
  totalLaborCost: number;
  totalOrders: number;
  totalCovers: number;
  avgTicket: number;
  grossMargin: number;
  foodCostPercentage: number;
  laborCostPercentage: number;
  netProfit: number;
  revenuePerCover: number;
  ordersPerDay: number;
}

export interface FinancesTrend {
  date: string;
  revenue: number;
  food_cost: number;
  labor_cost: number;
  profit: number;
}

export const useAggregatedFinances = (dateRange?: { start: Date; end: Date }) => {
  const { userId, isViewingClient } = useDataUserId();
  const { toast } = useToast();
  const [dailySales, setDailySales] = useState<AggregatedDailySales[]>([]);
  const [kpis, setKpis] = useState<AggregatedFinancesKPIs | null>(null);
  const [trends, setTrends] = useState<FinancesTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  const defaultDateRange = {
    start: subDays(new Date(), 30),
    end: new Date()
  };

  const range = dateRange || defaultDateRange;

  const fetchAggregatedData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const days = eachDayOfInterval({ start: range.start, end: range.end });
      const salesData: AggregatedDailySales[] = [];

      // Fetch aggregated data for each day using the database function
      for (const day of days) {
        const dateStr = format(day, 'yyyy-MM-dd');
        
        const { data, error } = await supabase.rpc('get_aggregated_daily_sales', {
          p_user_id: userId,
          p_date: dateStr
        });

        if (error) {
          console.error(`Error fetching data for ${dateStr}:`, error);
          continue;
        }

        if (data && data.length > 0) {
          const row = data[0];
          const revenue = Number(row.total_revenue) || 0;
          const foodCost = Number(row.food_cost) || 0;
          const laborCost = Number(row.labor_cost) || 0;

          salesData.push({
            date: dateStr,
            total_revenue: revenue,
            order_count: Number(row.order_count) || 0,
            covers_count: Number(row.covers_count) || 0,
            food_cost: foodCost,
            labor_cost: laborCost,
            avg_ticket: Number(row.avg_ticket) || 0,
            gross_margin: revenue > 0 ? ((revenue - foodCost) / revenue) * 100 : 0,
            food_cost_percentage: revenue > 0 ? (foodCost / revenue) * 100 : 0,
            labor_cost_percentage: revenue > 0 ? (laborCost / revenue) * 100 : 0
          });
        }
      }

      // Filter out days with no activity
      const activeDays = salesData.filter(d => d.total_revenue > 0 || d.order_count > 0);
      setDailySales(activeDays);
      setHasData(activeDays.length > 0);

      // Calculate KPIs
      if (activeDays.length > 0) {
        const totalRevenue = activeDays.reduce((sum, d) => sum + d.total_revenue, 0);
        const totalFoodCost = activeDays.reduce((sum, d) => sum + d.food_cost, 0);
        const totalLaborCost = activeDays.reduce((sum, d) => sum + d.labor_cost, 0);
        const totalOrders = activeDays.reduce((sum, d) => sum + d.order_count, 0);
        const totalCovers = activeDays.reduce((sum, d) => sum + d.covers_count, 0);

        setKpis({
          totalRevenue,
          totalFoodCost,
          totalLaborCost,
          totalOrders,
          totalCovers,
          avgTicket: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          grossMargin: totalRevenue > 0 ? ((totalRevenue - totalFoodCost) / totalRevenue) * 100 : 0,
          foodCostPercentage: totalRevenue > 0 ? (totalFoodCost / totalRevenue) * 100 : 0,
          laborCostPercentage: totalRevenue > 0 ? (totalLaborCost / totalRevenue) * 100 : 0,
          netProfit: totalRevenue - totalFoodCost - totalLaborCost,
          revenuePerCover: totalCovers > 0 ? totalRevenue / totalCovers : 0,
          ordersPerDay: activeDays.length > 0 ? totalOrders / activeDays.length : 0
        });

        // Build trends
        setTrends(activeDays.map(d => ({
          date: d.date,
          revenue: d.total_revenue,
          food_cost: d.food_cost,
          labor_cost: d.labor_cost,
          profit: d.total_revenue - d.food_cost - d.labor_cost
        })));
      } else {
        setKpis(null);
        setTrends([]);
      }
    } catch (error: any) {
      console.error('Error fetching aggregated finances:', error);
      toast({
        title: "Error al cargar finanzas",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [userId, range.start, range.end, toast]);

  // Also fetch from orders directly for real-time data
  const fetchRealtimeToday = useCallback(async () => {
    if (!userId) return null;

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data: orders, error } = await supabase
        .from('restaurant_orders')
        .select('total, guests_count, status, created_at')
        .eq('user_id', userId)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .not('status', 'in', '("cancelled","pending")');

      if (error) throw error;

      if (orders && orders.length > 0) {
        const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
        const totalCovers = orders.reduce((sum, o) => sum + (o.guests_count || 0), 0);

        return {
          revenue: totalRevenue,
          orders: orders.length,
          covers: totalCovers,
          avgTicket: orders.length > 0 ? totalRevenue / orders.length : 0
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching realtime data:', error);
      return null;
    }
  }, [userId]);

  useEffect(() => {
    fetchAggregatedData();
  }, [fetchAggregatedData]);

  return {
    dailySales,
    kpis,
    trends,
    loading,
    hasData,
    isViewingClient,
    fetchRealtimeToday,
    refetch: fetchAggregatedData
  };
};
