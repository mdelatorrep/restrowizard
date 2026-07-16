import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { toast } from 'sonner';
import { KitchenOrder, playKitchenNotificationSound, getKitchenStatusLabel } from '@/components/kitchen/kitchenTypes';
import { qk } from '@/lib/queryKeys';
import type { TablesUpdate } from '@/integrations/supabase/types';

const toKitchenOrder = (order: any): KitchenOrder => ({
  id: order.id,
  order_number: order.order_number,
  items: Array.isArray(order.items) ? order.items : [],
  kitchen_status: order.kitchen_status || 'pending',
  kitchen_notes: order.kitchen_notes || undefined,
  kitchen_started_at: order.kitchen_started_at || undefined,
  kitchen_ready_at: order.kitchen_ready_at || undefined,
  created_at: order.created_at,
  order_type: order.order_type,
  table_id: order.table_id || undefined,
});

export const useKitchenOrders = (soundEnabled: boolean) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading: loading } = useQuery({
    queryKey: qk.kitchen.orders(user?.id),
    enabled: !!user,
    queryFn: async (): Promise<KitchenOrder[]> => {
      const { data, error } = await supabase
        .from('restaurant_orders')
        .select('*')
        .eq('user_id', user!.id)
        .in('kitchen_status', ['pending', 'preparing', 'ready'])
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching orders:', error);
        toast.error('Error al cargar pedidos');
        throw error;
      }
      return (data || []).map(toKitchenOrder);
    },
  });

  const fetchOrders = useCallback(
    () => queryClient.invalidateQueries({ queryKey: qk.kitchen.orders(user?.id) }),
    [queryClient, user?.id]
  );

  useRealtimeTable({
    table: 'restaurant_orders',
    filter: user ? `user_id=eq.${user.id}` : undefined,
    enabled: !!user,
    onChange: (payload) => {
      // El estado sale siempre de la BD (invalidate); aquí solo quedan los
      // efectos de aviso al personal de cocina.
      if (payload.eventType === 'INSERT') {
        const newOrder = payload.new as any;
        if (newOrder.kitchen_status !== 'served') {
          if (soundEnabled) playKitchenNotificationSound();
          toast.info(`🆕 Nuevo pedido #${newOrder.order_number}`);
        }
      }
      fetchOrders();
    },
  });

  const updateOrderStatus = async (orderId: string, newStatus: KitchenOrder['kitchen_status']) => {
    try {
      const updates: TablesUpdate<'restaurant_orders'> = { kitchen_status: newStatus };
      if (newStatus === 'preparing') {
        updates.kitchen_started_at = new Date().toISOString();
      } else if (newStatus === 'ready') {
        updates.kitchen_ready_at = new Date().toISOString();
        if (soundEnabled) playKitchenNotificationSound();
      }
      const { error } = await supabase
        .from('restaurant_orders')
        .update(updates)
        .eq('id', orderId);
      if (error) throw error;
      await fetchOrders();
      toast.success(`Pedido actualizado a: ${getKitchenStatusLabel(newStatus)}`);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Error al actualizar pedido');
    }
  };

  return { orders, loading, fetchOrders, updateOrderStatus };
};
