import { useMemo } from 'react';
import { fetchAllRows } from '@/lib/fetchAllRows';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { qk } from '@/lib/queryKeys';
import { toOrderLines, getLineName, getLineQuantity, getLineRevenue, getOrderSaleAmount } from '@/lib/orderItems';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, format, eachDayOfInterval, eachWeekOfInterval, parseISO } from 'date-fns';
import {
  BUSINESS_UTC_OFFSET_HOURS, addBusinessDays, businessDayOf, businessDayStartIso, businessRangeIso, elapsedInBusinessDay, todayBusinessDay,
} from '@/lib/businessDay';
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

// B-20: regla única compartida (ver src/lib/orderItems.ts).
const saleAmt = getOrderSaleAmount;

export const useSalesReports = (
  period: ReportPeriod = 'daily',
  channel: SalesChannel = 'all'
) => {
  const { userId } = useDataUserId();

  // Ventanas en días operativos (src/lib/businessDay.ts): "últimos 7 días" son
  // hoy + los 6 días operativos previos, igual que el Dashboard. El período de
  // comparación cubre el MISMO tiempo transcurrido (6 días completos + lo que va
  // de hoy), para no comparar un día a medias contra uno completo.
  const dateRange = useMemo(() => {
    const span = period === 'daily' ? 7 : period === 'weekly' ? 28 : 90;
    const today = todayBusinessDay();
    const fromDay = addBusinessDays(today, -(span - 1));
    const prevFromDay = addBusinessDays(fromDay, -span);
    const prevLastDay = addBusinessDays(fromDay, -1);
    const elapsed = elapsedInBusinessDay(Date.now());
    return {
      // Fechas al mediodía local: solo sirven para rotular el eje del gráfico.
      start: new Date(`${fromDay}T12:00:00`),
      end: new Date(`${today}T12:00:00`),
      current: businessRangeIso(fromDay, today),
      previous: {
        from: businessDayStartIso(prevFromDay),
        toExclusive: new Date(Date.parse(businessDayStartIso(prevLastDay)) + elapsed).toISOString(),
      },
    };
  }, [period]);

  const { data, isLoading: loading } = useQuery({
    queryKey: qk.sales.reports(userId, period, channel),
    enabled: !!userId,
    queryFn: async (): Promise<{ rawOrders: any[]; previousPeriodOrders: any[] }> => {
      // B-47: paginado; un mes de ventas supera las 1.000 filas que devuelve una consulta.
      const curQ = () => {
        let q = supabase
          .from('restaurant_orders')
          .select('*')
          .eq('user_id', userId!)
          .gte('created_at', dateRange.current.from)
          .lt('created_at', dateRange.current.toExclusive);
        if (channel !== 'all') q = q.eq('sales_channel', channel);
        return q.order('created_at', { ascending: true }).order('id');
      };
      const { data: currentData, error: curErr } = await fetchAllRows(curQ);
      if (curErr) throw curErr;

      const prevQ = () => {
        let q = supabase
          .from('restaurant_orders')
          .select('id, total, tax_amount, tip_amount')
          .eq('user_id', userId!)
          .gte('created_at', dateRange.previous.from)
          .lt('created_at', dateRange.previous.toExclusive);
        if (channel !== 'all') q = q.eq('sales_channel', channel);
        return q.order('id');
      };
      const { data: prevData, error: prevErr } = await fetchAllRows(prevQ);
      if (prevErr) throw prevErr;

      return { rawOrders: currentData || [], previousPeriodOrders: prevData || [] };
    },
  });

  const rawOrders = useMemo(() => data?.rawOrders ?? [], [data]);
  const previousPeriodOrders = useMemo(() => data?.previousPeriodOrders ?? [], [data]);

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
      const orderDate = businessDayOf(order.created_at);
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
      // B-37: las líneas del POS usan `unit_price` y las web/manuales `price`.
      toOrderLines(order.items).forEach(item => {
        const name = getLineName(item);
        if (!productMap[name]) productMap[name] = { quantity: 0, revenue: 0 };
        productMap[name].quantity += getLineQuantity(item);
        productMap[name].revenue += getLineRevenue(item);
      });
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
      // Hora de Bogotá, no la del navegador.
      const hour = new Date(Date.parse(order.created_at) + BUSINESS_UTC_OFFSET_HOURS * 3_600_000).getUTCHours();
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
