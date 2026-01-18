import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, format, eachDayOfInterval, eachWeekOfInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly';

export interface SalesDataPoint {
  date: string;
  label: string;
  totalSales: number;
  orderCount: number;
  avgTicket: number;
  cashSales: number;
  cardSales: number;
  otherSales: number;
}

export interface SalesReportKPIs {
  totalRevenue: number;
  totalOrders: number;
  avgTicket: number;
  bestDay: string;
  bestDayAmount: number;
  growthPercent: number;
  cashPercent: number;
  cardPercent: number;
}

export interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

export interface HourlySales {
  hour: number;
  label: string;
  sales: number;
  orders: number;
}

export const useSalesReports = (period: ReportPeriod = 'daily') => {
  const { userId } = useDataUserId();
  const [loading, setLoading] = useState(true);
  const [rawOrders, setRawOrders] = useState<any[]>([]);
  const [previousPeriodOrders, setPreviousPeriodOrders] = useState<any[]>([]);

  // Calculate date range based on period
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case 'daily':
        return {
          start: subDays(now, 7),
          end: now,
          prevStart: subDays(now, 14),
          prevEnd: subDays(now, 7)
        };
      case 'weekly':
        return {
          start: subDays(now, 28),
          end: now,
          prevStart: subDays(now, 56),
          prevEnd: subDays(now, 28)
        };
      case 'monthly':
        return {
          start: subDays(now, 90),
          end: now,
          prevStart: subDays(now, 180),
          prevEnd: subDays(now, 90)
        };
    }
  }, [period]);

  // Fetch orders data
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch current period orders
        const { data: currentData } = await supabase
          .from('restaurant_orders')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', dateRange.start.toISOString())
          .lte('created_at', dateRange.end.toISOString())
          .order('created_at', { ascending: true });

        setRawOrders(currentData || []);

        // Fetch previous period for comparison
        const { data: prevData } = await supabase
          .from('restaurant_orders')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', dateRange.prevStart.toISOString())
          .lte('created_at', dateRange.prevEnd.toISOString());

        setPreviousPeriodOrders(prevData || []);
      } catch (error) {
        console.error('Error fetching sales reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, dateRange]);

  // Process chart data
  const chartData = useMemo((): SalesDataPoint[] => {
    if (!rawOrders.length) return [];

    const groupedData: Record<string, SalesDataPoint> = {};

    // Generate date labels
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    
    days.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      let label: string;
      
      if (period === 'daily') {
        label = format(day, 'EEE dd', { locale: es });
      } else if (period === 'weekly') {
        label = format(day, 'dd MMM', { locale: es });
      } else {
        label = format(day, 'MMM dd', { locale: es });
      }

      groupedData[key] = {
        date: key,
        label,
        totalSales: 0,
        orderCount: 0,
        avgTicket: 0,
        cashSales: 0,
        cardSales: 0,
        otherSales: 0
      };
    });

    // Aggregate orders
    rawOrders.forEach(order => {
      const orderDate = format(parseISO(order.created_at), 'yyyy-MM-dd');
      if (groupedData[orderDate]) {
        groupedData[orderDate].totalSales += Number(order.total) || 0;
        groupedData[orderDate].orderCount += 1;
        
        const paymentMethod = order.payment_method?.toLowerCase() || '';
        if (paymentMethod.includes('efectivo') || paymentMethod === 'cash') {
          groupedData[orderDate].cashSales += Number(order.total) || 0;
        } else if (paymentMethod.includes('tarjeta') || paymentMethod === 'card') {
          groupedData[orderDate].cardSales += Number(order.total) || 0;
        } else {
          groupedData[orderDate].otherSales += Number(order.total) || 0;
        }
      }
    });

    // Calculate averages
    Object.values(groupedData).forEach(point => {
      point.avgTicket = point.orderCount > 0 ? point.totalSales / point.orderCount : 0;
    });

    return Object.values(groupedData);
  }, [rawOrders, dateRange, period]);

  // Calculate KPIs
  const kpis = useMemo((): SalesReportKPIs => {
    const totalRevenue = rawOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const totalOrders = rawOrders.length;
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Find best day
    let bestDay = '';
    let bestDayAmount = 0;
    chartData.forEach(point => {
      if (point.totalSales > bestDayAmount) {
        bestDayAmount = point.totalSales;
        bestDay = point.label;
      }
    });

    // Calculate growth
    const prevRevenue = previousPeriodOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const growthPercent = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    // Payment method breakdown
    const cashTotal = rawOrders
      .filter(o => {
        const pm = o.payment_method?.toLowerCase() || '';
        return pm.includes('efectivo') || pm === 'cash';
      })
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    
    const cardTotal = rawOrders
      .filter(o => {
        const pm = o.payment_method?.toLowerCase() || '';
        return pm.includes('tarjeta') || pm === 'card';
      })
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const cashPercent = totalRevenue > 0 ? (cashTotal / totalRevenue) * 100 : 0;
    const cardPercent = totalRevenue > 0 ? (cardTotal / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalOrders,
      avgTicket,
      bestDay,
      bestDayAmount,
      growthPercent,
      cashPercent,
      cardPercent
    };
  }, [rawOrders, previousPeriodOrders, chartData]);

  // Top products
  const topProducts = useMemo((): TopProduct[] => {
    const productMap: Record<string, { quantity: number; revenue: number }> = {};

    rawOrders.forEach(order => {
      const items = order.items || [];
      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          const name = item.name || 'Sin nombre';
          if (!productMap[name]) {
            productMap[name] = { quantity: 0, revenue: 0 };
          }
          productMap[name].quantity += item.quantity || 1;
          productMap[name].revenue += (item.price || 0) * (item.quantity || 1);
        });
      }
    });

    return Object.entries(productMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [rawOrders]);

  // Hourly distribution
  const hourlyData = useMemo((): HourlySales[] => {
    const hourMap: Record<number, { sales: number; orders: number }> = {};
    
    // Initialize all hours
    for (let h = 0; h < 24; h++) {
      hourMap[h] = { sales: 0, orders: 0 };
    }

    rawOrders.forEach(order => {
      const hour = parseISO(order.created_at).getHours();
      hourMap[hour].sales += Number(order.total) || 0;
      hourMap[hour].orders += 1;
    });

    return Object.entries(hourMap).map(([hour, data]) => ({
      hour: parseInt(hour),
      label: `${hour.padStart(2, '0')}:00`,
      ...data
    }));
  }, [rawOrders]);

  return {
    chartData,
    kpis,
    topProducts,
    hourlyData,
    loading,
    hasData: rawOrders.length > 0
  };
};
