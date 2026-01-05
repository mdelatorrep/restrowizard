import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';

export const useGhostKitchenData = () => {
  const { userId, isViewingClient, clientName } = useDataUserId();

  // Virtual Brands
  const { data: virtualBrands, isLoading: brandsLoading } = useQuery({
    queryKey: ['virtual-brands', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('virtual_brands')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  // Aggregator Integrations
  const { data: aggregatorIntegrations, isLoading: integrationsLoading } = useQuery({
    queryKey: ['aggregator-integrations', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('aggregator_integrations')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  // Aggregator Orders
  const { data: aggregatorOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['aggregator-orders', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('aggregator_orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  // Kitchen Production Queue
  const { data: productionQueue, isLoading: queueLoading } = useQuery({
    queryKey: ['kitchen-production-queue', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('kitchen_production_queue')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  // Brand Menus
  const { data: brandMenus, isLoading: menusLoading } = useQuery({
    queryKey: ['brand-menus', userId],
    queryFn: async () => {
      if (!userId) return [];
      const brandIds = virtualBrands?.map(b => b.id) || [];
      if (brandIds.length === 0) return [];
      const { data, error } = await supabase
        .from('brand_menus')
        .select('*')
        .in('brand_id', brandIds);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId && (virtualBrands?.length || 0) > 0,
  });

  // Calculate KPIs
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = aggregatorOrders?.filter(o => 
    o.created_at?.startsWith(today)
  ) || [];

  const kpis = {
    totalOrders: todayOrders.length,
    totalRevenue: todayOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0),
    avgPrepTime: 0, // Would need completion times to calculate
    onTimeRate: 0,
    commissionPaid: todayOrders.reduce((sum, o) => sum + (o.commission || 0), 0),
  };

  // Group orders by platform
  const ordersByPlatform = aggregatorOrders?.reduce((acc, order) => {
    const platform = order.platform || 'unknown';
    if (!acc[platform]) {
      acc[platform] = { orders: 0, revenue: 0, commission: 0 };
    }
    acc[platform].orders += 1;
    acc[platform].revenue += order.subtotal || 0;
    acc[platform].commission += order.commission || 0;
    return acc;
  }, {} as Record<string, { orders: number; revenue: number; commission: number }>) || {};

  const hasData = (virtualBrands?.length || 0) > 0;

  return {
    virtualBrands: virtualBrands || [],
    aggregatorIntegrations: aggregatorIntegrations || [],
    aggregatorOrders: aggregatorOrders || [],
    productionQueue: productionQueue || [],
    brandMenus: brandMenus || [],
    kpis,
    ordersByPlatform,
    hasData,
    isLoading: brandsLoading || integrationsLoading || ordersLoading || queueLoading || menusLoading,
    isViewingClient,
    clientName,
  };
};
