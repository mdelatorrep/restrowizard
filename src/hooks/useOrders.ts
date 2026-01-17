import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDataUserId } from './useDataUserId';
import type { Json } from '@/integrations/supabase/types';

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface RestaurantOrder {
  id: string;
  user_id: string;
  order_number: number;
  source: string;
  order_type: string;
  status: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  delivery_address: string | null;
  delivery_notes: string | null;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: string | null;
  payment_status: string;
  estimated_time_minutes: number | null;
  assigned_driver: string | null;
  driver_phone: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeliveryZone {
  id: string;
  user_id: string;
  zone_name: string;
  polygon: Json | null;
  delivery_fee: number;
  min_order: number;
  estimated_time_minutes: number;
  is_active: boolean;
  created_at: string;
}

export interface OrderKPIs {
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;
  avgOrderValue: number;
  deliveryOrders: number;
  completionRate: number;
}

export const useOrders = () => {
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [kpis, setKpis] = useState<OrderKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const { toast } = useToast();
  const { userId } = useDataUserId();

  const calculateKPIs = (data: RestaurantOrder[]): OrderKPIs => {
    const total = data.length;
    if (total === 0) {
      return { totalOrders: 0, todayOrders: 0, pendingOrders: 0, avgOrderValue: 0, deliveryOrders: 0, completionRate: 0 };
    }

    const today = new Date().toISOString().split('T')[0];
    const todayOrders = data.filter(o => o.created_at.startsWith(today)).length;
    const pending = data.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status)).length;
    const avgValue = data.reduce((sum, o) => sum + o.total, 0) / total;
    const delivery = data.filter(o => o.order_type === 'delivery').length;
    const completed = data.filter(o => o.status === 'completed').length;

    return {
      totalOrders: total,
      todayOrders,
      pendingOrders: pending,
      avgOrderValue: Math.round(avgValue),
      deliveryOrders: delivery,
      completionRate: Math.round((completed / total) * 100),
    };
  };

  const fetchOrders = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurant_orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      const ordersData = (data || []) as unknown as RestaurantOrder[];
      setOrders(ordersData);
      setKpis(calculateKPIs(ordersData));
      setHasData(ordersData.length > 0);

      const { data: zonesData } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('user_id', userId)
        .order('zone_name');
      
      setZones((zonesData || []) as unknown as DeliveryZone[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData: { items: OrderItem[]; subtotal: number; total: number; [key: string]: unknown }) => {
    if (!userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('restaurant_orders')
        .insert([{ 
          items: orderData.items as unknown as Json,
          subtotal: orderData.subtotal,
          total: orderData.total,
          user_id: userId,
          source: orderData.source as string | undefined,
          order_type: orderData.order_type as string | undefined,
          customer_name: orderData.customer_name as string | undefined,
          customer_phone: orderData.customer_phone as string | undefined,
          delivery_address: orderData.delivery_address as string | undefined,
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast({ title: 'Pedido creado', description: `Pedido #${data.order_number} registrado` });
      await fetchOrders();
      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      toast({ title: 'Error', description: 'No se pudo crear el pedido', variant: 'destructive' });
      return null;
    }
  };

  const updateOrderStatus = async (id: string, status: string, notes?: string) => {
    try {
      const updates: Record<string, unknown> = { status };
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('restaurant_orders')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await supabase.from('order_status_history').insert([{
        order_id: id,
        status,
        notes,
        changed_by: userId,
      }]);
      
      toast({ title: 'Estado actualizado', description: `Pedido marcado como ${status}` });
      await fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar el pedido', variant: 'destructive' });
    }
  };

  const createZone = async (zoneData: { zone_name: string; [key: string]: unknown }) => {
    if (!userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('delivery_zones')
        .insert([{ 
          zone_name: zoneData.zone_name,
          user_id: userId,
          polygon: (zoneData.polygon ?? null) as Json,
          delivery_fee: zoneData.delivery_fee as number | undefined,
          min_order: zoneData.min_order as number | undefined,
          estimated_time_minutes: zoneData.estimated_time_minutes as number | undefined,
          is_active: zoneData.is_active as boolean | undefined,
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast({ title: 'Zona creada', description: 'La zona de delivery ha sido configurada' });
      await fetchOrders();
      return data;
    } catch (error) {
      console.error('Error creating zone:', error);
      toast({ title: 'Error', description: 'No se pudo crear la zona', variant: 'destructive' });
      return null;
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [userId]);

  return {
    orders,
    zones,
    kpis,
    loading,
    hasData,
    createOrder,
    updateOrderStatus,
    createZone,
    refetch: fetchOrders,
  };
};
