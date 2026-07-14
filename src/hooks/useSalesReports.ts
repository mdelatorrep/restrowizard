import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, format, eachDayOfInterval, eachWeekOfInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly';
export type SalesChannel = 'all' | 'dine_in' | 'pos' | 'delivery_own' | 'rappi' | 'takeout' | 'other';

export const CHANNEL_LABELS: Record<Exclude<SalesChannel, 'all'>, string> = {
  dine_in: 'Salón',
  pos: 'POS / Mostrador',
  delivery_own: 'Domicilio propio',
  rappi: 'Rappi',
  takeout: 'Para llevar',
  other: 'Otros',
};

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
  netRevenue: number;      // TK-9: ventas netas (sin impuesto)
  taxCollected: number;    // TK-9: impuesto recaudado
  totalOrders: number;
  avgTicket: number;
  bestDay: string;
  bestDayAmount: number;
  growthPercent: number;
  cashPercent: number;
  cardPercent: number;
  // TK-4: comensales (guests_count)
  totalCovers: number;
  avgPartySize: number;
  revenuePerCover: number;
}

export interface PaymentMethodBreakdown {
  method: string;          // TK-10: granular (Nequi, Daviplata, Transferencia, etc.)
  amount: number;
  percent: number;
}

export interface ChannelBreakdown {
  channel: Exclude<SalesChannel, 'all'>;
  label: string;
  amount: number;
  orders: number;
  percent: number;
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

const normalizeMethod = (raw: string | null | undefined): string => {
  const m = (raw || '').toString().trim();
  if (!m) return 'Sin especificar';
  const lower = m.toLowerCase();
  // TK-26: cualquier valor "desconocido/unknown/null/n/a" cae a Sin especificar
  if (['desconocido', 'unknown', 'null', 'na', 'n/a', '-', 'otro', 'other'].includes(lower)) return 'Sin especificar';
  if (lower === 'cash' || lower.includes('efectivo')) return 'Efectivo';
  if (lower === 'card' || lower.includes('tarjeta') || lower.includes('credit') || lower.includes('debit')) return 'Tarjeta';
  if (lower.includes('nequi')) return 'Nequi';
  if (lower.includes('daviplata')) return 'Daviplata';
  if (lower.includes('bancolombia')) return 'Bancolombia';
  if (lower.includes('transfer') || lower.includes('pse')) return 'Transferencia';
  if (lower.includes('qr')) return 'QR';
  if (lower.includes('mercadopago') || lower.includes('mercado pago')) return 'MercadoPago';
  // Devolver con primera letra mayúscula
  return m.charAt(0).toUpperCase() + m.slice(1);
};

// B-20: monto de VENTA (excluye propina). total = subtotal(+impuesto) + propina.
const saleAmt = (o: any): number => Math.max(0, (Number(o?.total) || 0) - (Number(o?.tip_amount) || 0));

export const useSalesReports = (
  period: ReportPeriod = 'daily',
  channel: SalesChannel = 'all'
) => {
  const { userId } = useDataUserId();
  const [loading, setLoading] = useState(true);
  const [rawOrders, setRawOrders] = useState<any[]>([]);
  const [previousPeriodOrders, setPreviousPeriodOrders] = useState<any[]>([]);

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case 'daily':
        return { start: subDays(now, 7), end: now, prevStart: subDays(now, 14), prevEnd: subDays(now, 7) };
      case 'weekly':
        return { start: subDays(now, 28), end: now, prevStart: subDays(now, 56), prevEnd: subDays(now, 28) };
      case 'monthly':
        return { start: subDays(now, 90), end: now, prevStart: subDays(now, 180), prevEnd: subDays(now, 90) };
    }
  }, [period]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) { setLoading(false); return; }
      setLoading(true);
      try {
        let curQ = supabase
          .from('restaurant_orders')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', dateRange.start.toISOString())
          .lte('created_at', dateRange.end.toISOString())
          .order('created_at', { ascending: true });
        if (channel !== 'all') curQ = curQ.eq('sales_channel', channel);
        const { data: currentData } = await curQ;
        setRawOrders(currentData || []);

        let prevQ = supabase
          .from('restaurant_orders')
          .select('total, tax_amount, tip_amount')
          .eq('user_id', userId)
          .gte('created_at', dateRange.prevStart.toISOString())
          .lte('created_at', dateRange.prevEnd.toISOString());
        if (channel !== 'all') prevQ = prevQ.eq('sales_channel', channel);
        const { data: prevData } = await prevQ;
        setPreviousPeriodOrders(prevData || []);
      } catch (error) {
        console.error('Error fetching sales reports:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, dateRange, channel]);

  const chartData = useMemo((): SalesDataPoint[] => {
    const groupedData: Record<string, SalesDataPoint> = {};
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    days.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      const label = period === 'daily'
        ? format(day, 'EEE dd', { locale: es })
        : period === 'weekly'
          ? format(day, 'dd MMM', { locale: es })
          : format(day, 'MMM dd', { locale: es });
      groupedData[key] = { date: key, label, totalSales: 0, orderCount: 0, avgTicket: 0, cashSales: 0, cardSales: 0, otherSales: 0 };
    });

    rawOrders.forEach(order => {
      const orderDate = format(parseISO(order.created_at), 'yyyy-MM-dd');
      if (!groupedData[orderDate]) return;
      const total = saleAmt(order);
      groupedData[orderDate].totalSales += total;
      groupedData[orderDate].orderCount += 1;
      const m = normalizeMethod(order.payment_method);
      if (m === 'Efectivo') groupedData[orderDate].cashSales += total;
      else if (m === 'Tarjeta') groupedData[orderDate].cardSales += total;
      else groupedData[orderDate].otherSales += total;
    });

    Object.values(groupedData).forEach(point => {
      point.avgTicket = point.orderCount > 0 ? point.totalSales / point.orderCount : 0;
    });
    return Object.values(groupedData);
  }, [rawOrders, dateRange, period]);

  const kpis = useMemo((): SalesReportKPIs => {
    const totalRevenue = rawOrders.reduce((sum, o) => sum + saleAmt(o), 0);
    const taxCollected = rawOrders.reduce((sum, o) => sum + (Number(o.tax_amount) || 0), 0);
    const netRevenue = Math.max(0, totalRevenue - taxCollected);
    const totalOrders = rawOrders.length;
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // TK-4: cubiertos
    const totalCovers = rawOrders.reduce((sum, o) => sum + (Number(o.guests_count) || 0), 0);
    const avgPartySize = totalOrders > 0 ? totalCovers / totalOrders : 0;
    const revenuePerCover = totalCovers > 0 ? totalRevenue / totalCovers : 0;

    let bestDay = ''; let bestDayAmount = 0;
    chartData.forEach(p => { if (p.totalSales > bestDayAmount) { bestDayAmount = p.totalSales; bestDay = p.label; } });

    const prevRevenue = previousPeriodOrders.reduce((sum, o) => sum + saleAmt(o), 0);
    const growthPercent = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    const cashTotal = rawOrders.filter(o => normalizeMethod(o.payment_method) === 'Efectivo').reduce((s, o) => s + saleAmt(o), 0);
    const cardTotal = rawOrders.filter(o => normalizeMethod(o.payment_method) === 'Tarjeta').reduce((s, o) => s + saleAmt(o), 0);
    const cashPercent = totalRevenue > 0 ? (cashTotal / totalRevenue) * 100 : 0;
    const cardPercent = totalRevenue > 0 ? (cardTotal / totalRevenue) * 100 : 0;

    return { totalRevenue, netRevenue, taxCollected, totalOrders, avgTicket, bestDay, bestDayAmount, growthPercent, cashPercent, cardPercent, totalCovers, avgPartySize, revenuePerCover };
  }, [rawOrders, previousPeriodOrders, chartData]);

  // TK-10: desglose granular de métodos de pago.
  const paymentMethodBreakdown = useMemo((): PaymentMethodBreakdown[] => {
    const map: Record<string, number> = {};
    let total = 0;
    rawOrders.forEach(o => {
      const m = normalizeMethod(o.payment_method);
      const amt = saleAmt(o);
      map[m] = (map[m] || 0) + amt;
      total += amt;
    });
    return Object.entries(map)
      .map(([method, amount]) => ({ method, amount, percent: total > 0 ? (amount / total) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount);
  }, [rawOrders]);

  // TK-1: desglose por canal de venta.
  const channelBreakdown = useMemo((): ChannelBreakdown[] => {
    const map: Record<string, { amount: number; orders: number }> = {};
    let total = 0;
    rawOrders.forEach(o => {
      const ch = (o.sales_channel || 'other') as Exclude<SalesChannel, 'all'>;
      if (!map[ch]) map[ch] = { amount: 0, orders: 0 };
      const amt = saleAmt(o);
      map[ch].amount += amt;
      map[ch].orders += 1;
      total += amt;
    });
    return Object.entries(map)
      .map(([ch, v]) => ({
        channel: ch as Exclude<SalesChannel, 'all'>,
        label: CHANNEL_LABELS[ch as Exclude<SalesChannel, 'all'>] || ch,
        amount: v.amount,
        orders: v.orders,
        percent: total > 0 ? (v.amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [rawOrders]);

  const topProducts = useMemo((): TopProduct[] => {
    const productMap: Record<string, { quantity: number; revenue: number }> = {};
    rawOrders.forEach(order => {
      const items = order.items || [];
      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          const name = item.name || 'Sin nombre';
          if (!productMap[name]) productMap[name] = { quantity: 0, revenue: 0 };
          productMap[name].quantity += item.quantity || 1;
          productMap[name].revenue += (item.price || 0) * (item.quantity || 1);
        });
      }
    });
    return Object.entries(productMap)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [rawOrders]);

  const hourlyData = useMemo((): HourlySales[] => {
    const hourMap: Record<number, { sales: number; orders: number }> = {};
    for (let h = 0; h < 24; h++) hourMap[h] = { sales: 0, orders: 0 };
    rawOrders.forEach(order => {
      const hour = parseISO(order.created_at).getHours();
      hourMap[hour].sales += saleAmt(order);
      hourMap[hour].orders += 1;
    });
    return Object.entries(hourMap).map(([hour, d]) => ({
      hour: parseInt(hour),
      label: `${hour.padStart(2, '0')}:00`,
      ...d,
    }));
  }, [rawOrders]);

  return {
    chartData,
    kpis,
    topProducts,
    hourlyData,
    paymentMethodBreakdown,
    channelBreakdown,
    loading,
    hasData: rawOrders.length > 0,
  };
};
