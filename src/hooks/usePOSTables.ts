import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRealtimeTable } from './useRealtimeTable';
import { useToast } from './use-toast';

export interface RestaurantTable {
  id: string;
  user_id: string;
  table_number: string;
  zone_id: string | null;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'billing' | 'maintenance';
  current_order_id: string | null;
  waiter_id: string | null;
  position_x: number;
  position_y: number;
  shape: 'rectangle' | 'circle' | 'square';
  created_at: string;
  updated_at: string;
}

export const usePOSTables = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTables = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .eq('user_id', user.id)
        .order('table_number');

      if (error) throw error;
      setTables((data || []) as RestaurantTable[]);
    } catch (error: any) {
      console.error('Error fetching tables:', error);
      toast({
        title: "Error al cargar mesas",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  const createTable = async (tableData: {
    table_number: string;
    capacity?: number;
    zone_id?: string;
    shape?: 'rectangle' | 'circle' | 'square';
    position_x?: number;
    position_y?: number;
  }) => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .insert({
          user_id: user.id,
          ...tableData
        })
        .select()
        .single();

      if (error) throw error;

      setTables(prev => [...prev, data as RestaurantTable]);
      toast({
        title: "Mesa creada",
        description: `Mesa ${tableData.table_number} agregada`
      });

      return data as RestaurantTable;
    } catch (error: any) {
      console.error('Error creating table:', error);
      toast({
        title: "Error al crear mesa",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const updateTableStatus = async (
    tableId: string, 
    status: RestaurantTable['status'],
    orderId?: string | null,
    waiterId?: string | null
  ) => {
    try {
      const updates: Partial<RestaurantTable> = { status };
      if (orderId !== undefined) updates.current_order_id = orderId;
      if (waiterId !== undefined) updates.waiter_id = waiterId;

      const { data, error } = await supabase
        .from('restaurant_tables')
        .update(updates)
        .eq('id', tableId)
        .select()
        .single();

      if (error) throw error;

      setTables(prev => prev.map(t => t.id === tableId ? data as RestaurantTable : t));
      return data as RestaurantTable;
    } catch (error: any) {
      console.error('Error updating table:', error);
      toast({
        title: "Error al actualizar mesa",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const assignOrderToTable = async (tableId: string, orderId: string) => {
    return updateTableStatus(tableId, 'occupied', orderId);
  };

  const releaseTable = async (tableId: string) => {
    return updateTableStatus(tableId, 'available', null, null);
  };

  const transferTable = async (fromTableId: string, toTableId: string) => {
    const fromTable = tables.find(t => t.id === fromTableId);
    if (!fromTable?.current_order_id) {
      toast({
        title: "Error",
        description: "La mesa de origen no tiene un pedido activo",
        variant: "destructive"
      });
      return null;
    }

    try {
      // Update the destination table
      await updateTableStatus(toTableId, 'occupied', fromTable.current_order_id, fromTable.waiter_id);
      
      // Release the source table
      await releaseTable(fromTableId);

      // Update order with new table
      await supabase
        .from('restaurant_orders')
        .update({ table_id: toTableId })
        .eq('id', fromTable.current_order_id);

      toast({
        title: "Mesa transferida",
        description: "El pedido ha sido movido a la nueva mesa"
      });

      return true;
    } catch (error: any) {
      console.error('Error transferring table:', error);
      toast({
        title: "Error al transferir",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteTable = async (tableId: string) => {
    try {
      const { error } = await supabase
        .from('restaurant_tables')
        .delete()
        .eq('id', tableId);

      if (error) throw error;

      setTables(prev => prev.filter(t => t.id !== tableId));
      toast({
        title: "Mesa eliminada"
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting table:', error);
      toast({
        title: "Error al eliminar mesa",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('restaurant_tables_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurant_tables',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTables(prev => [...prev, payload.new as RestaurantTable]);
          } else if (payload.eventType === 'UPDATE') {
            setTables(prev => prev.map(t => 
              t.id === payload.new.id ? payload.new as RestaurantTable : t
            ));
          } else if (payload.eventType === 'DELETE') {
            setTables(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const availableTables = tables.filter(t => t.status === 'available');
  const occupiedTables = tables.filter(t => t.status === 'occupied');
  const reservedTables = tables.filter(t => t.status === 'reserved');

  return {
    tables,
    loading,
    availableTables,
    occupiedTables,
    reservedTables,
    createTable,
    updateTableStatus,
    assignOrderToTable,
    releaseTable,
    transferTable,
    deleteTable,
    refetch: fetchTables
  };
};
