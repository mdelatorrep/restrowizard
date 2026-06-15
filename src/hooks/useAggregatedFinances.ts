import { useState, useEffect, useCallback, useMemo } from 'react';
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
  taxes: number;
  avg_ticket: number;
  gross_margin: number;
  food_cost_percentage: number;
  labor_cost_percentage: number;
}

export interface AggregatedFinancesKPIs {
  totalRevenue: number;
  totalFoodCost: number;
  totalLaborCost: number;
  totalTaxes: number;
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

  // Use numeric timestamps so deps are stable across renders even if the
  // parent passes a freshly-constructed { start, end } object each render.
  const startMs = dateRange ? dateRange.start.getTime() : subDays(new Date(), 30).setHours(0, 0, 0, 0);
  const endMs = dateRange ? dateRange.end.getTime() : new Date().setHours(23, 59, 59, 999);
  // Round to the day so re-renders within the same day don't change deps.
  const startDayMs = Math.floor(startMs / 86400000);
  const endDayMs = Math.floor(endMs / 86400000);
  const range = useMemo(
    () => ({ start: new Date(startDayMs * 86400000), end: new Date((endDayMs + 1) * 86400000 - 1) }),
    [startDayMs, endDayMs]
  );

  const fetchAggregatedData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const startStr = format(range.start, 'yyyy-MM-dd');
      const endStr = format(range.end, 'yyyy-MM-dd');

      // 1) Orders (revenue/covers/order_count)
      const ordersPromise = supabase
        .from('restaurant_orders')
        .select('id, total, tax_amount, guests_count, status, created_at')
        .eq('user_id', userId)
        .gte('created_at', `${startStr}T00:00:00`)
        .lte('created_at', `${endStr}T23:59:59`)
        .not('status', 'in', '("cancelled","pending")');


      // 2) Inventory deductions joined with item unit_cost (food cost from sales)
      const deductionsPromise = supabase
        .from('inventory_deductions')
        .select('deducted_at, quantity_deducted, inventory_items(unit_cost)')
        .eq('user_id', userId)
        .gte('deducted_at', `${startStr}T00:00:00`)
        .lte('deducted_at', `${endStr}T23:59:59`);

      // 3) Staff shifts (labor cost)
      // BL-16: incluir también shifts confirmados/en progreso, no solo completados.
      // Si no hay actual_*, usamos horarios programados.
      const shiftsPromise = supabase
        .from('staff_shifts')
        .select('shift_date, start_time, end_time, actual_start_time, actual_end_time, break_minutes, hourly_rate_override, status, staff_members(hourly_rate)')
        .eq('user_id', userId)
        .gte('shift_date', startStr)
        .lte('shift_date', endStr)
        .in('status', ['scheduled', 'confirmed', 'in_progress', 'completed']);

      // 4) Manual daily_sales overrides (other_costs and any manually-entered food/labor)
      const manualPromise = supabase
        .from('daily_sales')
        .select('*')
        .eq('user_id', userId)
        .gte('sale_date', startStr)
        .lte('sale_date', endStr);

      const [ordersRes, deductionsRes, shiftsRes, manualRes] = await Promise.all([
        ordersPromise, deductionsPromise, shiftsPromise, manualPromise,
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (deductionsRes.error) throw deductionsRes.error;
      if (shiftsRes.error) throw shiftsRes.error;
      if (manualRes.error) throw manualRes.error;

      // Group orders by date
      const ordersByDate: Record<string, { revenue: number; count: number; covers: number; taxes: number }> = {};
      (ordersRes.data || []).forEach((order: any) => {
        const dateKey = format(new Date(order.created_at), 'yyyy-MM-dd');
        if (!ordersByDate[dateKey]) ordersByDate[dateKey] = { revenue: 0, count: 0, covers: 0, taxes: 0 };
        ordersByDate[dateKey].revenue += Number(order.total) || 0;
        ordersByDate[dateKey].count += 1;
        ordersByDate[dateKey].covers += order.guests_count || 0;
        ordersByDate[dateKey].taxes += Number(order.tax_amount) || 0;
      });


      // Food cost by date = Σ(qty_deducted × unit_cost)
      const foodCostByDate: Record<string, number> = {};
      (deductionsRes.data || []).forEach((d: any) => {
        const dateKey = format(new Date(d.deducted_at), 'yyyy-MM-dd');
        const unitCost = Number(d.inventory_items?.unit_cost) || 0;
        foodCostByDate[dateKey] = (foodCostByDate[dateKey] || 0) + (Number(d.quantity_deducted) || 0) * unitCost;
      });

      // Labor cost by date = hours × hourly_rate (override > staff base)
      const laborCostByDate: Record<string, number> = {};
      (shiftsRes.data || []).forEach((s: any) => {
        const dateKey = s.shift_date as string;
        const start = s.actual_start_time || s.start_time;
        const end = s.actual_end_time || s.end_time;
        if (!start || !end) return;
        const toMs = (t: string) => {
          const [h, m, sec] = String(t).split(':').map(Number);
          return ((h || 0) * 3600 + (m || 0) * 60 + (sec || 0)) * 1000;
        };
        // C8-01: descontar descanso (break_minutes) para que coincida con módulo Turnos
        const breakMs = (Number(s.break_minutes) || 0) * 60_000;
        const hours = Math.max(0, (toMs(end) - toMs(start) - breakMs) / 3_600_000);
        const rate = Number(s.hourly_rate_override) || Number(s.staff_members?.hourly_rate) || 0;
        laborCostByDate[dateKey] = (laborCostByDate[dateKey] || 0) + hours * rate;
      });

      // Manual overrides: if user typed a value in daily_sales, ADD to computed
      // (allows recording costs not captured by POS, e.g. waste, off-shift labor).
      const manualByDate: Record<string, { food: number; labor: number }> = {};
      (manualRes.data || []).forEach((m: any) => {
        manualByDate[m.sale_date] = {
          food: Number(m.food_cost) || 0,
          labor: Number(m.labor_cost) || 0,
        };
      });

      const allDates = new Set([
        ...Object.keys(ordersByDate),
        ...Object.keys(foodCostByDate),
        ...Object.keys(laborCostByDate),
        ...Object.keys(manualByDate),
      ]);

      const salesData: AggregatedDailySales[] = [];
      allDates.forEach(dateStr => {
        const orderData = ordersByDate[dateStr] || { revenue: 0, count: 0, covers: 0, taxes: 0 };
        const shiftFood = foodCostByDate[dateStr] || 0;
        const shiftLabor = laborCostByDate[dateStr] || 0;
        // C8-01: el costo manual (daily_sales) actúa como FALLBACK,
        // no se suma encima del costo calculado por turnos/inventario.
        // Así Finanzas y Turnos coinciden cuando hay datos operativos.
        const foodCost = shiftFood > 0 ? shiftFood : (manualByDate[dateStr]?.food || 0);
        const laborCost = shiftLabor > 0 ? shiftLabor : (manualByDate[dateStr]?.labor || 0);
        const revenue = orderData.revenue;

        if (revenue > 0 || orderData.count > 0 || foodCost > 0 || laborCost > 0) {
          salesData.push({
            date: dateStr,
            total_revenue: revenue,
            order_count: orderData.count,
            covers_count: orderData.covers,
            food_cost: foodCost,
            labor_cost: laborCost,
            taxes: orderData.taxes,
            avg_ticket: orderData.count > 0 ? revenue / orderData.count : 0,
            gross_margin: revenue > 0 ? ((revenue - foodCost) / revenue) * 100 : 0,
            food_cost_percentage: revenue > 0 ? (foodCost / revenue) * 100 : 0,
            labor_cost_percentage: revenue > 0 ? (laborCost / revenue) * 100 : 0,
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
        const totalTaxes = salesData.reduce((sum, d) => sum + (d.taxes || 0), 0);
        const totalOrders = salesData.reduce((sum, d) => sum + d.order_count, 0);
        const totalCovers = salesData.reduce((sum, d) => sum + d.covers_count, 0);

        setKpis({
          totalRevenue,
          totalFoodCost,
          totalLaborCost,
          totalTaxes,
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
  }, [userId, startDayMs, endDayMs, toast]);

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
