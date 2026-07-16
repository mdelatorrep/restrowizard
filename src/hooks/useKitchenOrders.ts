import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { toast } from 'sonner';
import { KitchenOrder, playKitchenNotificationSound, getKitchenStatusLabel } from '@/components/kitchen/kitchenTypes';
import type { TablesUpdate } from '@/integrations/supabase/types';

export const useKitchenOrders = (soundEnabled: boolean) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('restaurant_orders')
        .select('*')
        .eq('user_id', user.id)
        .in('kitchen_status', ['pending', 'preparing', 'ready'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      const formatted: KitchenOrder[] = (data || []).map((order: any) => ({
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
      }));
      setOrders(formatted);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useRealtimeTable({
    table: 'restaurant_orders',
    filter: user ? `user_id=eq.${user.id}` : undefined,
    enabled: !!user,
    onChange: (payload) => {
      if (payload.eventType === 'INSERT') {
        const newOrder = payload.new as any;
        if (newOrder.kitchen_status !== 'served') {
          const formatted: KitchenOrder = {
            id: newOrder.id,
            order_number: newOrder.order_number,
            items: Array.isArray(newOrder.items) ? newOrder.items : [],
            kitchen_status: newOrder.kitchen_status || 'pending',
            kitchen_notes: newOrder.kitchen_notes,
            kitchen_started_at: newOrder.kitchen_started_at,
            kitchen_ready_at: newOrder.kitchen_ready_at,
            created_at: newOrder.created_at,
            order_type: newOrder.order_type,
            table_id: newOrder.table_id,
          };
          setOrders((prev) => [...prev, formatted]);
          if (soundEnabled) playKitchenNotificationSound();
          toast.info(`🆕 Nuevo pedido #${newOrder.order_number}`);
        }
      } else if (payload.eventType === 'UPDATE') {
        const updated = payload.new as any;
        if (updated.kitchen_status === 'served') {
          setOrders((prev) => prev.filter((o) => o.id !== updated.id));
        } else {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === updated.id
                ? {
                    ...o,
                    kitchen_status: updated.kitchen_status,
                    kitchen_notes: updated.kitchen_notes,
                    kitchen_started_at: updated.kitchen_started_at,
                    kitchen_ready_at: updated.kitchen_ready_at,
                  }
                : o
            )
          );
        }
      } else if (payload.eventType === 'DELETE') {
        setOrders((prev) => prev.filter((o) => o.id !== (payload.old as any).id));
      }
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
      toast.success(`Pedido actualizado a: ${getKitchenStatusLabel(newStatus)}`);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Error al actualizar pedido');
    }
  };

  return { orders, loading, fetchOrders, updateOrderStatus };
};
