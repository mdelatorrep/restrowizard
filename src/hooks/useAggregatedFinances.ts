import { useCallback, useMemo } from 'react';
import { fetchAllRows } from '@/lib/fetchAllRows';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { useToast } from './use-toast';
import { calcShiftLaborCost, calcShiftLaborCostElapsed } from '@/lib/laborCost';
import {
  addBusinessDays, businessDayOf, businessRangeIso, elapsedInBusinessDay, localCalendarDay, todayBusinessDay,
} from '@/lib/businessDay';
import { qk } from '@/lib/queryKeys';
import { getOrderSaleAmount } from '@/lib/orderItems';
import { allocateExpenses, manualOtherCostsNotCoveredByExpenses, monthEndOf, monthStartOf, type ExpenseForPnl } from '@/hooks/finance/expenseAllocation';

// B-20: regla única compartida (ver src/lib/orderItems.ts).
const saleAmt = getOrderSaleAmount;

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
  netSales: number;
  totalOtherCosts: number;
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
  const queryClient = useQueryClient();

  // Período en DÍAS OPERATIVOS (src/lib/businessDay.ts). Antes se redondeaba a
  // medianoche UTC y en Bogotá "últimos 7 días" consultaba 8: Dashboard y
  // Reportes no cuadraban. El inicio es la fecha de calendario que eligió el
  // usuario; el fin, el día operativo del instante final (a la 1 a. m. "hoy"
  // todavía es la noche de ayer).
  const today = todayBusinessDay();
  const fromDay = dateRange ? localCalendarDay(dateRange.start) : addBusinessDays(today, -30);
  // Nunca más allá de hoy: "Este mes" el día 1 es el día 1, no el mes completo.
  // Antes el arriendo de noviembre entero se cargaba contra un día de ventas.
  const rawToDay = dateRange ? businessDayOf(dateRange.end) : today;
  const cappedToDay = rawToDay > today ? today : rawToDay;
  const toDay = cappedToDay < fromDay ? fromDay : cappedToDay;

  const { data, isLoading: loading } = useQuery({
    queryKey: qk.finances.aggregated(userId, fromDay, toDay),
    enabled: !!userId,
    queryFn: async (): Promise<{
      dailySales: AggregatedDailySales[];
      kpis: AggregatedFinancesKPIs | null;
      trends: FinancesTrend[];
      revenueAtSameTimeByDate: Record<string, number>;
      otherCostsByCategory: Record<string, number>;
    }> => {
      const startStr = fromDay;
      const endStr = toDay;
      const window = businessRangeIso(fromDay, toDay);
      const nowMs = Date.now();
      const currentDay = todayBusinessDay();
      const elapsedNow = elapsedInBusinessDay(nowMs);

      // B-47: las cuatro consultas se paginan; sin esto un mes con volumen se cortaba en 1.000 filas.
      // 1) Orders (revenue/covers/order_count)
      const ordersPromise = fetchAllRows(() => supabase
        .from('restaurant_orders')
        .select('id, total, tax_amount, tip_amount, guests_count, status, created_at')
        .eq('user_id', userId!)
        .gte('created_at', window.from)
        .lt('created_at', window.toExclusive)
        .not('status', 'in', '("cancelled","pending")')
        .order('id'));

      // 2) Inventory deductions joined with item unit_cost (food cost from sales)
      const deductionsPromise = fetchAllRows(() => supabase
        .from('inventory_deductions')
        .select('id, deducted_at, quantity_deducted, inventory_items(unit_cost)')
        .eq('user_id', userId!)
        .gte('deducted_at', window.from)
        .lt('deducted_at', window.toExclusive)
        .order('id'));

      // 3) Staff shifts (labor cost)
      // BL-16: incluir también shifts confirmados/en progreso, no solo completados.
      // Si no hay actual_*, usamos horarios programados.
      const shiftsPromise = fetchAllRows(() => supabase
        .from('staff_shifts')
        .select('id, shift_date, start_time, end_time, actual_start_time, actual_end_time, break_minutes, hourly_rate_override, status, staff_members(hourly_rate)')
        .eq('user_id', userId!)
        .gte('shift_date', startStr)
        .lte('shift_date', endStr)
        .in('status', ['scheduled', 'confirmed', 'in_progress', 'completed'])
        .order('id'));

      // 4) Manual daily_sales overrides (other_costs and any manually-entered food/labor)
      const manualPromise = fetchAllRows(() => supabase
        .from('daily_sales')
        .select('*')
        .eq('user_id', userId!)
        .gte('sale_date', startStr)
        .lte('sale_date', endStr)
        .order('id'));

      // 5) Gastos registrados (arriendo, servicios, prestaciones…): los fijos se
      //    prorratean en su mes, así que se traen desde el inicio del mes.
      const expensesPromise = fetchAllRows(() => (supabase as any)
        .from('restaurant_expenses')
        .select('id, expense_date, amount, is_fixed, status, category')
        .eq('user_id', userId!)
        .gte('expense_date', monthStartOf(startStr))
        .lte('expense_date', monthEndOf(endStr))
        .neq('status', 'cancelled')
        .order('id'));

      const [ordersRes, deductionsRes, shiftsRes, manualRes, expensesRes] = await Promise.all([
        ordersPromise, deductionsPromise, shiftsPromise, manualPromise, expensesPromise,
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (deductionsRes.error) throw deductionsRes.error;
      if (shiftsRes.error) throw shiftsRes.error;
      if (manualRes.error) throw manualRes.error;
      // Si la tabla de gastos aún no existe en un entorno, el P&L sigue funcionando sin ella.
      const expenseRows = expensesRes.error ? [] : ((expensesRes.data || []) as ExpenseForPnl[]);
      const expenseAlloc = allocateExpenses(expenseRows, startStr, endStr);

      // Group orders by date
      const ordersByDate: Record<string, { revenue: number; count: number; covers: number; taxes: number }> = {};
      // Venta acumulada de cada día hasta la misma hora de hoy: el flash compara
      // "hoy a esta hora" contra "ayer a esta hora", no contra el día completo.
      const revenueAtSameTimeByDate: Record<string, number> = {};
      (ordersRes.data || []).forEach((order: any) => {
        const dateKey = businessDayOf(order.created_at);
        if (elapsedInBusinessDay(order.created_at) <= elapsedNow) {
          revenueAtSameTimeByDate[dateKey] = (revenueAtSameTimeByDate[dateKey] || 0) + saleAmt(order);
        }
        if (!ordersByDate[dateKey]) ordersByDate[dateKey] = { revenue: 0, count: 0, covers: 0, taxes: 0 };
        ordersByDate[dateKey].revenue += saleAmt(order);
        ordersByDate[dateKey].count += 1;
        ordersByDate[dateKey].covers += order.guests_count || 0;
        ordersByDate[dateKey].taxes += Number(order.tax_amount) || 0;
      });


      // Food cost by date = Σ(qty_deducted × unit_cost)
      const foodCostByDate: Record<string, number> = {};
      (deductionsRes.data || []).forEach((d: any) => {
        const dateKey = businessDayOf(d.deducted_at);
        const unitCost = Number(d.inventory_items?.unit_cost) || 0;
        foodCostByDate[dateKey] = (foodCostByDate[dateKey] || 0) + (Number(d.quantity_deducted) || 0) * unitCost;
      });

      // Labor cost by date — TK-2: fórmula única (lib/laborCost) compartida con módulo Turnos.
      const laborCostByDate: Record<string, number> = {};
      (shiftsRes.data || []).forEach((s: any) => {
        const dateKey = s.shift_date as string;
        // El día en curso lleva solo lo devengado hasta ahora (igual que la venta).
        const cost = dateKey === currentDay
          ? calcShiftLaborCostElapsed(s, s.staff_members?.hourly_rate, nowMs)
          : calcShiftLaborCost(s, s.staff_members?.hourly_rate);
        if (cost > 0) {
          laborCostByDate[dateKey] = (laborCostByDate[dateKey] || 0) + cost;
        }
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
        const netDay = Math.max(0, revenue - (orderData.taxes || 0));

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
            gross_margin: netDay > 0 ? ((netDay - foodCost) / netDay) * 100 : 0,
            food_cost_percentage: netDay > 0 ? (foodCost / netDay) * 100 : 0,
            labor_cost_percentage: netDay > 0 ? (laborCost / netDay) * 100 : 0,
          });
        }

      });

      // Sort by date
      salesData.sort((a, b) => a.date.localeCompare(b.date));

      // Calculate KPIs
      if (salesData.length === 0) {
        return { dailySales: salesData, kpis: null, trends: [], revenueAtSameTimeByDate, otherCostsByCategory: expenseAlloc.byCategory };
      }
      {
        const totalRevenue = salesData.reduce((sum, d) => sum + d.total_revenue, 0);
        const totalFoodCost = salesData.reduce((sum, d) => sum + d.food_cost, 0);
        const totalLaborCost = salesData.reduce((sum, d) => sum + d.labor_cost, 0);
        const totalTaxes = salesData.reduce((sum, d) => sum + (d.taxes || 0), 0);
        const totalOrders = salesData.reduce((sum, d) => sum + d.order_count, 0);
        const totalCovers = salesData.reduce((sum, d) => sum + d.covers_count, 0);
        const netSales = Math.max(0, totalRevenue - totalTaxes);
        // Otros costos = costos manuales del cierre diario + gastos registrados (devengados).
        // Otros costos = gastos registrados (devengados) + la estimación plana del
        // cierre diario solo en los meses que todavía no tienen gastos registrados.
        const totalOtherCosts = manualOtherCostsNotCoveredByExpenses(manualRes.data || [], expenseRows)
          + expenseAlloc.total;

        const computedKpis: AggregatedFinancesKPIs = {
          totalRevenue,
          totalFoodCost,
          totalLaborCost,
          totalTaxes,
          totalOrders,
          totalCovers,

          avgTicket: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          grossMargin: netSales > 0 ? ((netSales - totalFoodCost) / netSales) * 100 : 0,
          foodCostPercentage: netSales > 0 ? (totalFoodCost / netSales) * 100 : 0,
          laborCostPercentage: netSales > 0 ? (totalLaborCost / netSales) * 100 : 0,
          netSales,
          totalOtherCosts,
          netProfit: netSales - totalFoodCost - totalLaborCost - totalOtherCosts,
          revenuePerCover: totalCovers > 0 ? totalRevenue / totalCovers : 0,
          ordersPerDay: salesData.length > 0 ? totalOrders / salesData.length : 0
        };

        // Build trends
        const computedTrends: FinancesTrend[] = salesData.map(d => ({
          date: d.date,
          revenue: d.total_revenue,
          food_cost: d.food_cost,
          labor_cost: d.labor_cost,
          profit: d.total_revenue - d.food_cost - d.labor_cost
        }));

        return {
          dailySales: salesData, kpis: computedKpis, trends: computedTrends, revenueAtSameTimeByDate,
          otherCostsByCategory: expenseAlloc.byCategory,
        };
      }
    },
  });

  // Fetch realtime today data
  const fetchRealtimeToday = useCallback(async () => {
    if (!userId) return null;

    try {
      const day = todayBusinessDay();
      const win = businessRangeIso(day, day);
      const { data: orders, error } = await supabase
        .from('restaurant_orders')
        .select('total, tip_amount, guests_count, status, created_at')
        .eq('user_id', userId!)
        .gte('created_at', win.from)
        .lt('created_at', win.toExclusive)
        .not('status', 'in', '("cancelled","pending")');

      if (error) throw error;

      if (orders && orders.length > 0) {
        // B-20: excluir propina, igual que los KPIs del periodo. Antes esta
        // tarjeta ("hoy") sumaba propinas y no cuadraba con el resto de Finanzas.
        const totalRevenue = orders.reduce((sum, o) => sum + saleAmt(o), 0);
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

  const refetch = useCallback(
    () => queryClient.invalidateQueries({ queryKey: qk.finances.aggregated(userId, fromDay, toDay) }),
    [queryClient, userId, fromDay, toDay]
  );

  return {
    dailySales: data?.dailySales ?? [],
    kpis: data?.kpis ?? null,
    trends: data?.trends ?? [],
    loading,
    hasData: (data?.dailySales?.length ?? 0) > 0,
    /** Venta acumulada de cada día operativo hasta la hora actual del día en curso. */
    revenueAtSameTimeByDate: data?.revenueAtSameTimeByDate ?? {},
    /** Gastos registrados del período por categoría (devengados). */
    otherCostsByCategory: data?.otherCostsByCategory ?? {},
    /** Días operativos que cubre el período (inclusive), recortado a hoy. */
    period: { fromDay, toDay },
    /** El período elegido todavía no termina: cifras acumuladas a la fecha. */
    isPartialPeriod: rawToDay > today,
    isViewingClient,
    fetchRealtimeToday,
    refetch
  };
};
