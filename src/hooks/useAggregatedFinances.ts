import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { useToast } from './use-toast';
import { format, subDays } from 'date-fns';

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
      const startStr = format(range.start, 'yyyy-MM-dd');
      const endStr = format(range.end, 'yyyy-MM-dd');

      // Fetch orders for the date range in a SINGLE query
      const { data: orders, error: ordersError } = await supabase
        .from('restaurant_orders')
        .select('id, total, guests_count, status, created_at, items')
        .eq('user_id', userId)
        .gte('created_at', `${startStr}T00:00:00`)
        .lte('created_at', `${endStr}T23:59:59`)
        .not('status', 'in', '("cancelled","pending")');

      if (ordersError) throw ordersError;

      // Fetch daily_sales for cost data in a SINGLE query
      const { data: dailySalesData, error: salesError } = await supabase
        .from('daily_sales')
        .select('*')
        .eq('user_id', userId)
        .gte('sale_date', startStr)
        .lte('sale_date', endStr)
        .order('sale_date', { ascending: true });

      if (salesError) throw salesError;

      // Group orders by date
      const ordersByDate: Record<string, { revenue: number; count: number; covers: number }> = {};
      
      (orders || []).forEach(order => {
        const dateKey = format(new Date(order.created_at), 'yyyy-MM-dd');
        if (!ordersByDate[dateKey]) {
          ordersByDate[dateKey] = { revenue: 0, count: 0, covers: 0 };
        }
        ordersByDate[dateKey].revenue += Number(order.total) || 0;
        ordersByDate[dateKey].count += 1;
        ordersByDate[dateKey].covers += order.guests_count || 0;
      });

      // Create daily sales map from daily_sales table
      const costsByDate: Record<string, { foodCost: number; laborCost: number }> = {};
      (dailySalesData || []).forEach(sale => {
        costsByDate[sale.sale_date] = {
          foodCost: Number(sale.food_cost) || 0,
          laborCost: Number(sale.labor_cost) || 0
        };
      });

      // Merge data into aggregated format
      const allDates = new Set([...Object.keys(ordersByDate), ...Object.keys(costsByDate)]);
      const salesData: AggregatedDailySales[] = [];

      allDates.forEach(dateStr => {
        const orderData = ordersByDate[dateStr] || { revenue: 0, count: 0, covers: 0 };
        const costData = costsByDate[dateStr] || { foodCost: 0, laborCost: 0 };
        
        const revenue = orderData.revenue;
        const foodCost = costData.foodCost;
        const laborCost = costData.laborCost;

        if (revenue > 0 || orderData.count > 0) {
          salesData.push({
            date: dateStr,
            total_revenue: revenue,
            order_count: orderData.count,
            covers_count: orderData.covers,
            food_cost: foodCost,
            labor_cost: laborCost,
            avg_ticket: orderData.count > 0 ? revenue / orderData.count : 0,
            gross_margin: revenue > 0 ? ((revenue - foodCost) / revenue) * 100 : 0,
            food_cost_percentage: revenue > 0 ? (foodCost / revenue) * 100 : 0,
            labor_cost_percentage: revenue > 0 ? (laborCost / revenue) * 100 : 0
          });
        }
      });

      // Sort by date
      salesData.sort((a, b) => a.date.localeCompare(b.date));

      setDailySales(salesData);
      setHasData(salesData.length > 0);

      // Calculate KPIs
      if (salesData.length > 0) {
        const totalRevenue = salesData.reduce((sum, d) => sum + d.total_revenue, 0);
        const totalFoodCost = salesData.reduce((sum, d) => sum + d.food_cost, 0);
        const totalLaborCost = salesData.reduce((sum, d) => sum + d.labor_cost, 0);
        const totalOrders = salesData.reduce((sum, d) => sum + d.order_count, 0);
        const totalCovers = salesData.reduce((sum, d) => sum + d.covers_count, 0);

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
          ordersPerDay: salesData.length > 0 ? totalOrders / salesData.length : 0
        });

        // Build trends
        setTrends(salesData.map(d => ({
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

  // Fetch realtime today data
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
